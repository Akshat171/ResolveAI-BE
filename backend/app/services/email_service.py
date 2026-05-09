from __future__ import annotations

import asyncio
import email as email_lib
import email.policy
import re
import uuid
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import parseaddr
from typing import Optional

import aiosmtplib
from imapclient import IMAPClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.models.conversation import Conversation
from app.models.email_inbox import EmailInbox
from app.models.message import Message


def _extract_text_body(msg) -> str:
    """Extract plain text body from email message."""
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            ct = part.get_content_type()
            disp = str(part.get("Content-Disposition", ""))
            if ct == "text/plain" and "attachment" not in disp:
                charset = part.get_content_charset() or "utf-8"
                try:
                    body = part.get_payload(decode=True).decode(charset, errors="replace")
                    break
                except Exception:
                    continue
    else:
        charset = msg.get_content_charset() or "utf-8"
        try:
            body = msg.get_payload(decode=True).decode(charset, errors="replace")
        except Exception:
            body = str(msg.get_payload())
    # Strip quoted reply text (lines starting with ">")
    lines = body.splitlines()
    clean = [l for l in lines if not l.startswith(">")]
    return "\n".join(clean).strip()


def _strip_reply_history(body: str) -> str:
    """Remove common reply separators like 'On ... wrote:'"""
    patterns = [
        r"\nOn .+wrote:\n",
        r"\n-+\s*Original Message\s*-+",
        r"\nFrom:.*\nSent:.*\nTo:",
    ]
    for pat in patterns:
        body = re.split(pat, body, maxsplit=1, flags=re.DOTALL)[0]
    return body.strip()


async def send_email(
    inbox: EmailInbox,
    to_email: str,
    to_name: str,
    subject: str,
    body: str,
    in_reply_to: Optional[str] = None,
    references: Optional[str] = None,
) -> str:
    """Send an email via SMTP. Returns the sent Message-ID."""
    msg = MIMEMultipart("alternative")
    msg_id = f"<{uuid.uuid4()}@resolvai>"
    msg["Message-ID"] = msg_id
    msg["From"] = f"{inbox.name} <{inbox.email}>"
    msg["To"] = f"{to_name} <{to_email}>" if to_name else to_email
    msg["Subject"] = subject if subject.startswith("Re:") else f"Re: {subject}"
    if in_reply_to:
        msg["In-Reply-To"] = in_reply_to
    if references:
        msg["References"] = references
    elif in_reply_to:
        msg["References"] = in_reply_to

    msg.attach(MIMEText(body, "plain", "utf-8"))

    await aiosmtplib.send(
        msg,
        hostname=inbox.smtp_host,
        port=inbox.smtp_port,
        username=inbox.smtp_username,
        password=_clean_password(inbox.smtp_password),
        start_tls=inbox.smtp_use_tls,
    )
    return msg_id


def _clean_password(password: str) -> str:
    """Strip spaces and non-ASCII characters — Gmail app passwords are displayed
    with spaces but must be sent without them."""
    return "".join(c for c in password if c.isascii() and not c.isspace())


def _fetch_new_emails(inbox: EmailInbox) -> list[dict]:
    """Synchronous IMAP fetch — run in executor."""
    results = []
    try:
        ssl = inbox.imap_use_ssl
        with IMAPClient(inbox.imap_host, port=inbox.imap_port, ssl=ssl) as client:
            client.login(inbox.imap_username, _clean_password(inbox.imap_password))
            client.select_folder("INBOX")
            # Only fetch emails received since this inbox was created (ignore old backlog)
            since_date = inbox.created_at.date()
            uids = client.search(["UNSEEN", "SINCE", since_date])
            if not uids:
                return results
            # Cap at 10 most recent per poll
            uids = uids[-10:]
            messages = client.fetch(uids, ["RFC822", "FLAGS"])
            for uid, data in messages.items():
                raw = data[b"RFC822"]
                msg = email_lib.message_from_bytes(raw, policy=email_lib.policy.default)
                from_name, from_email = parseaddr(msg.get("From", ""))
                subject = msg.get("Subject", "(no subject)")
                message_id = msg.get("Message-ID", f"<uid-{uid}@unknown>").strip()
                in_reply_to = (msg.get("In-Reply-To") or "").strip()
                references = (msg.get("References") or "").strip()
                # Skip marketing/bulk/automated emails
                if msg.get("List-Unsubscribe") or msg.get("List-ID"):
                    continue
                auto_submitted = (msg.get("Auto-Submitted") or "").lower()
                if auto_submitted and auto_submitted != "no":
                    continue
                if "no-reply" in from_email or "noreply" in from_email or "donotreply" in from_email:
                    continue
                if "newsletter" in (msg.get("X-Mailer") or "").lower():
                    continue

                body = _extract_text_body(msg)
                body = _strip_reply_history(body)
                if not body:
                    continue
                results.append({
                    "uid": uid,
                    "from_email": from_email.lower().strip(),
                    "from_name": from_name,
                    "subject": subject,
                    "message_id": message_id,
                    "in_reply_to": in_reply_to,
                    "references": references,
                    "body": body,
                })
            # Mark fetched emails as seen
            if uids:
                client.set_flags(uids, [b"\\Seen"])
    except Exception as e:
        import structlog
        log = structlog.get_logger()
        log.error("imap_fetch_error", inbox_id=str(inbox.id), error=str(e))
    return results


async def process_inbox(inbox: EmailInbox, db: AsyncSession) -> int:
    """
    Poll one inbox for new emails, create/update conversations, trigger AI reply.
    Returns number of emails processed.
    """
    loop = asyncio.get_event_loop()
    emails = await loop.run_in_executor(None, _fetch_new_emails, inbox)

    processed = 0
    for em in emails:
        try:
            await _handle_inbound_email(inbox, em, db)
            processed += 1
        except Exception as e:
            import structlog
            structlog.get_logger().error("email_process_error", error=str(e), message_id=em.get("message_id"))

    # Update last_checked_at
    inbox.last_checked_at = datetime.now(timezone.utc)
    await db.commit()
    return processed


async def _handle_inbound_email(inbox: EmailInbox, em: dict, db: AsyncSession):
    """Create or update a conversation from an inbound email, then trigger AI reply."""
    from app.services.chat_service import get_ai_response
    from app.services.emotion_service import detect_emotion, is_negative
    from app.services.escalation_service import create_escalation

    # Truncate body to 3000 chars to stay within embedding token limits
    em = {**em, "body": em["body"][:3000]}

    # Deduplication — skip if we already processed this exact email
    existing = await db.execute(
        select(Message).where(
            Message.tenant_id == inbox.tenant_id,
            Message.email_message_id == em["message_id"],
        )
    )
    if existing.scalar_one_or_none():
        return  # already processed

    conversation = None

    # Try to match to existing conversation via In-Reply-To header
    if em["in_reply_to"]:
        result = await db.execute(
            select(Conversation).where(
                Conversation.tenant_id == inbox.tenant_id,
                Conversation.channel == "email",
                Conversation.metadata_["email_thread_id"].as_string() == em["in_reply_to"],
            )
        )
        conversation = result.scalar_one_or_none()

    # Also try matching by sender email + subject (fuzzy thread matching)
    if not conversation and em["from_email"]:
        clean_subject = re.sub(r"^(re:\s*)+", "", em["subject"], flags=re.IGNORECASE).strip()
        result = await db.execute(
            select(Conversation).where(
                Conversation.tenant_id == inbox.tenant_id,
                Conversation.channel == "email",
                Conversation.visitor_email == em["from_email"],
                Conversation.email_subject == clean_subject,
                Conversation.status != "resolved",
            ).order_by(Conversation.created_at.desc()).limit(1)
        )
        conversation = result.scalar_one_or_none()

    if not conversation:
        # New conversation
        clean_subject = re.sub(r"^(re:\s*)+", "", em["subject"], flags=re.IGNORECASE).strip()
        meta = {"email_thread_id": em["message_id"], "email_references": em["message_id"]}
        conversation = Conversation(
            tenant_id=inbox.tenant_id,
            visitor_email=em["from_email"],
            visitor_name=em["from_name"] or em["from_email"].split("@")[0],
            channel="email",
            email_inbox_id=inbox.id,
            email_subject=clean_subject,
            status="active",
            metadata_=meta,
        )
        db.add(conversation)
        await db.flush()
    else:
        # Update thread references
        meta = dict(conversation.metadata_ or {})
        meta["email_references"] = (meta.get("email_references", "") + " " + em["message_id"]).strip()
        conversation.metadata_ = meta

    # Emotion detection
    emotion_result = detect_emotion(em["body"])
    emotion = emotion_result["emotion"]
    meta = dict(conversation.metadata_ or {})
    if is_negative(emotion):
        meta["consecutive_frustrated"] = meta.get("consecutive_frustrated", 0) + 1
    else:
        meta["consecutive_frustrated"] = 0
    meta["last_emotion"] = emotion
    conversation.metadata_ = meta

    # Save visitor message
    visitor_msg = Message(
        conversation_id=conversation.id,
        tenant_id=inbox.tenant_id,
        role="visitor",
        content=em["body"],
        emotion=emotion,
        email_message_id=em["message_id"],
    )
    db.add(visitor_msg)
    await db.flush()

    # Only auto-reply if conversation is active (not escalated/resolved)
    if conversation.status == "active":
        ai_response = await get_ai_response(db, conversation, em["body"], emotion=emotion)

        ai_msg = Message(
            conversation_id=conversation.id,
            tenant_id=inbox.tenant_id,
            role="ai",
            content=ai_response["content"],
            confidence_score=ai_response["confidence"],
            sources=ai_response["sources"],
            token_usage=ai_response.get("token_usage"),
        )
        db.add(ai_msg)
        await db.flush()

        # Send the AI reply via SMTP
        thread_id = conversation.metadata_.get("email_thread_id", "")
        references = conversation.metadata_.get("email_references", "")
        await send_email(
            inbox=inbox,
            to_email=em["from_email"],
            to_name=em["from_name"] or "",
            subject=conversation.email_subject or em["subject"],
            body=ai_response["content"],
            in_reply_to=thread_id,
            references=references,
        )

        # Check escalation
        if conversation.status != "escalated":
            if ai_response["confidence"] < 0.4:
                await create_escalation(db, conversation, "low_confidence", f"AI confidence: {ai_response['confidence']:.2f}")
            elif meta.get("consecutive_frustrated", 0) >= 2:
                await create_escalation(db, conversation, "frustration_detected", f"Customer sent {meta['consecutive_frustrated']} frustrated emails")

    await db.commit()


async def poll_all_inboxes():
    """Called by the background scheduler — polls all active email inboxes."""
    async with async_session_factory() as db:
        result = await db.execute(
            select(EmailInbox).where(EmailInbox.is_active == True)
        )
        inboxes = result.scalars().all()
        for inbox in inboxes:
            await process_inbox(inbox, db)
