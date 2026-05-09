"""
Demo data seed script.
Run from the backend directory:
    python seed_demo.py [email]

If no email given, it looks for the first user in the DB.
"""

import sys
import uuid
from datetime import datetime, timedelta, timezone
import psycopg2
from psycopg2.extras import RealDictCursor

DB = "postgresql://resolvai:password@localhost:5433/resolvai"

def uid():
    return str(uuid.uuid4())

def ts(days_ago=0, hours_ago=0, minutes_ago=0):
    dt = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
    return dt.isoformat()

def run(target_email=None):
    conn = psycopg2.connect(DB, cursor_factory=RealDictCursor)
    conn.autocommit = False
    cur = conn.cursor()

    # ── Find tenant / user ──────────────────────────────────────────────────
    if target_email:
        cur.execute("SELECT id, tenant_id, full_name FROM users WHERE email = %s", (target_email,))
    else:
        cur.execute("SELECT id, tenant_id, full_name FROM users ORDER BY created_at ASC LIMIT 1")
    user = cur.fetchone()
    if not user:
        print("No user found. Sign up first, then run this script.")
        sys.exit(1)

    user_id   = str(user["id"])
    tenant_id = str(user["tenant_id"])
    print(f"Seeding for user {user['full_name']} — tenant {tenant_id}")

    # ── Update tenant name & settings ──────────────────────────────────────
    cur.execute("""
        UPDATE tenants SET
            name = 'Acme Corp',
            settings = %s::jsonb
        WHERE id = %s
    """, (
        '{"widget_color":"#0B6E6B","widget_position":"bottom-right","greeting_message":"Hi! How can I help you today?","proactive_enabled":true,"proactive_message":"👋 Need help? I\'m here!","proactive_time_delay":30,"proactive_exit_intent":true,"proactive_scroll_depth":70}',
        tenant_id
    ))

    # ── Canned Responses ───────────────────────────────────────────────────
    cur.execute("DELETE FROM canned_responses WHERE tenant_id = %s", (tenant_id,))
    canned = [
        ("Greeting",           "/hi",       "Hi there! 👋 Thanks for reaching out to Acme Corp. How can I help you today?"),
        ("Pricing Info",       "/price",    "Our plans start at $29/month for the Starter tier. You can view all pricing details at acmecorp.com/pricing. Would you like me to walk you through the differences?"),
        ("Refund Policy",      "/refund",   "We offer a full refund within 30 days of purchase, no questions asked. Just reply with your order number and I'll get that started for you."),
        ("Technical Issue",    "/tech",     "Sorry to hear you're running into an issue! Could you share a screenshot or describe the error message you're seeing? Our team will get this sorted quickly."),
        ("Follow Up",          "/followup", "Just following up to make sure everything is working well on your end. Is there anything else I can help you with?"),
        ("Closing",            "/bye",      "Happy to help! If you ever have more questions, don't hesitate to reach out. Have a great day! 😊"),
    ]
    for title, shortcut, content in canned:
        cur.execute("""
            INSERT INTO canned_responses (id, tenant_id, title, shortcut, content, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
        """, (uid(), tenant_id, title, shortcut, content))
    print("✓ Canned responses")

    # ── Knowledge Base ─────────────────────────────────────────────────────
    cur.execute("SELECT id FROM knowledge_bases WHERE tenant_id = %s LIMIT 1", (tenant_id,))
    kb = cur.fetchone()
    if not kb:
        kb_id = uid()
        cur.execute("""
            INSERT INTO knowledge_bases (id, tenant_id, name, description, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, true, NOW(), NOW())
        """, (kb_id, tenant_id, "Acme Corp Help Center", "Product docs, FAQs, and policies"))
    else:
        kb_id = str(kb["id"])
        cur.execute("UPDATE knowledge_bases SET name = 'Acme Corp Help Center', description = 'Product docs, FAQs, and policies' WHERE id = %s", (kb_id,))

    cur.execute("DELETE FROM knowledge_items WHERE tenant_id = %s", (tenant_id,))
    kb_items = [
        ("text", None, "Getting Started Guide",           "ready", 12),
        ("text", None, "Refund & Returns Policy",         "ready", 5),
        ("text", None, "Billing FAQ",                     "ready", 8),
        ("url",  "https://acmecorp.com/docs/api",         "API Reference",  "ready", 24),
        ("url",  "https://acmecorp.com/blog/changelog",   "Product Changelog", "ready", 6),
        ("text", None, "Troubleshooting Common Issues",   "ready", 9),
        ("text", None, "Account & Password Reset",        "ready", 4),
    ]
    for src_type, src_url, title, status, chunks in kb_items:
        cur.execute("""
            INSERT INTO knowledge_items (id, knowledge_base_id, tenant_id, source_type, source_url, title, status, chunk_count, content_hash, metadata, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, '{}'::jsonb, NOW(), NOW())
        """, (uid(), kb_id, tenant_id, src_type, src_url, title, status, chunks, uid()[:16]))
    print("✓ Knowledge base")

    # ── Conversations + Messages + Escalations ─────────────────────────────
    cur.execute("DELETE FROM conversations WHERE tenant_id = %s", (tenant_id,))

    convos = [
        # (visitor_name, visitor_email, status, channel, confidence_avg, resolution_type, days_ago, messages, escalate)
        ("Sarah Mitchell",  "sarah@techwave.io",    "resolved", "widget",    0.92, "ai_resolved",  1,  [
            ("visitor", "Hi, I'm having trouble logging in. I keep getting 'invalid credentials'.", "neutral"),
            ("ai",      "Hi Sarah! Sorry to hear that. Let me help — first, can you try resetting your password via the 'Forgot Password' link on the login page?", None),
            ("visitor", "I tried that but didn't receive the reset email.", "frustrated"),
            ("ai",      "Got it. Let me check your account status. Can you confirm the email address you signed up with?", None),
            ("visitor", "It's sarah@techwave.io", "neutral"),
            ("ai",      "I found your account. Your email was unverified — I've just resent the verification email. Check your spam folder too!", None),
            ("visitor", "Got it! That worked, thank you so much!", "happy"),
            ("ai",      "Great! Glad we got that sorted. Don't hesitate to reach out if you need anything else 😊", None),
        ], False),

        ("James Okonkwo",   "james@boldmedia.co",   "resolved", "widget",    0.87, "ai_resolved",  2,  [
            ("visitor", "Can you tell me about your pricing plans?", "neutral"),
            ("ai",      "Of course! We have three plans: Starter ($29/mo), Growth ($79/mo), and Scale ($199/mo). Each includes unlimited conversations — the main difference is the number of AI responses per month and team seats. Which best fits your team size?", None),
            ("visitor", "We're a team of 5. What does Growth include?", "neutral"),
            ("ai",      "The Growth plan includes up to 10,000 AI responses/month, 5 agent seats, full analytics, and priority email support. It's our most popular plan for teams your size!", None),
            ("visitor", "That sounds perfect. Does it have a free trial?", "neutral"),
            ("ai",      "Yes! You get a 14-day free trial on any plan, no credit card required. You can upgrade at acmecorp.com/pricing anytime.", None),
            ("visitor", "Perfect, I'll sign up. Thanks!", "happy"),
        ], False),

        ("Priya Sharma",    "priya@launchfast.dev",  "active",   "widget",    0.74, None,     0,  [
            ("visitor", "Hello! I need help setting up the API integration.", "neutral"),
            ("ai",      "Hi Priya! Happy to help with the API setup. Are you using our REST API or one of our SDKs (Node.js, Python)?", None),
            ("visitor", "REST API, using Python requests.", "neutral"),
            ("ai",      "Perfect. Start by grabbing your API key from Settings → API Keys. Then use the base URL `https://api.acmecorp.com/v1` with the header `X-API-Key: your_key`. Want a quick code snippet?", None),
            ("visitor", "Yes please!", "happy"),
            ("ai",      "```python\nimport requests\n\nheaders = {'X-API-Key': 'YOUR_KEY'}\nresponse = requests.get('https://api.acmecorp.com/v1/me', headers=headers)\nprint(response.json())\n```\nThis confirms your auth is working. What endpoint are you trying to hit?", None),
        ], False),

        ("Marcus Webb",     "marcus@inflowsuite.com","escalated","widget",    0.41, None,     0,  [
            ("visitor", "This is absolutely ridiculous. I've been charged TWICE for my subscription this month!", "angry"),
            ("ai",      "I'm so sorry about that, Marcus. A double charge is definitely not acceptable. Let me look into this right away.", None),
            ("visitor", "I've been waiting 3 days already and nobody has helped me. This is terrible customer service!", "angry"),
            ("ai",      "I completely understand your frustration, and I sincerely apologize for the delay. I'm escalating this to a billing specialist right now — you'll be contacted within the hour.", None),
        ], True),

        ("Lisa Tanaka",     "lisa@craftful.studio",  "resolved", "email",     0.89, "ai_resolved",  3,  [
            ("visitor", "Hi, do you offer nonprofit discounts?", "neutral"),
            ("ai",      "Hi Lisa! Yes — we offer a 40% discount for registered nonprofits. You'd just need to provide your 501(c)(3) documentation. Want me to send you the application form?", None),
            ("visitor", "That would be amazing, yes please!", "happy"),
            ("ai",      "I've sent the form to lisa@craftful.studio. Once submitted, our team reviews it within 2 business days. Is there anything else I can help with?", None),
            ("visitor", "No, that's all. Thank you!", "happy"),
        ], False),

        ("David Chen",      "david@nuvohq.com",      "resolved", "widget",    0.95, "ai_resolved",  4,  [
            ("visitor", "How do I export my conversation history?", "neutral"),
            ("ai",      "Great question! Go to Analytics → Conversations, then click the 'Export' button in the top-right. You can export as CSV or JSON for any date range.", None),
            ("visitor", "Found it! Works perfectly, thanks.", "happy"),
        ], False),

        ("Aisha Osei",      "aisha@greenpetal.org",  "resolved", "widget",    0.78, "human_resolved", 5,  [
            ("visitor", "I accidentally deleted my knowledge base. Can it be recovered?", "frustrated"),
            ("ai",      "Oh no, I'm sorry to hear that! Unfortunately, deleted knowledge bases can't be restored automatically. However, our team keeps daily backups. I'm escalating this to a support engineer who can check the backup for you.", None),
            ("visitor", "Please, it had months of work in it.", "frustrated"),
            ("ai",      "Understood — I've flagged this as urgent. A support engineer will contact you within 30 minutes.", None),
        ], False),

        ("Tom Eriksson",    "tom@pixelbloom.se",     "active",   "whatsapp",  0.81, None,     0,  [
            ("visitor", "Hey! Does the widget support Swedish language?", "neutral"),
            ("ai",      "Hi Tom! Yes — the widget is fully multilingual. It auto-detects the visitor's browser language and responds accordingly. Swedish is supported out of the box 🇸🇪", None),
            ("visitor", "Awesome! What about RTL languages like Arabic?", "neutral"),
            ("ai",      "RTL support is on our roadmap for Q3. For now, the widget displays LTR. I can add you to the early access list for when it launches — want me to do that?", None),
        ], False),

        ("Rachel Kim",      "rachel@driftware.io",   "resolved", "widget",    0.91, "ai_resolved",  6,  [
            ("visitor", "What's the difference between AI-resolved and human-resolved in analytics?", "neutral"),
            ("ai",      "Good question! 'AI-resolved' means the AI answered the question and the visitor left satisfied (no escalation). 'Human-resolved' means a human agent took over and closed the ticket. The split helps you track how much your AI is handling independently.", None),
            ("visitor", "Makes sense. And what does confidence score mean?", "neutral"),
            ("ai",      "The confidence score (0–1) reflects how certain the AI is about its answer based on your knowledge base. Scores above 0.8 are high-confidence; below 0.5 usually triggers an escalation suggestion.", None),
            ("visitor", "Very helpful, thank you!", "happy"),
        ], False),

        ("Ben Fowler",      "ben@stacklabs.dev",     "resolved", "widget",    0.85, "ai_resolved",  7,  [
            ("visitor", "Can I use the widget on multiple domains?", "neutral"),
            ("ai",      "Yes! A single API key works across all your domains — no additional setup needed. If you want separate analytics per domain, you can create multiple API keys (one per domain) under Settings → API Keys.", None),
            ("visitor", "Perfect. And there's no extra charge for multiple domains?", "neutral"),
            ("ai",      "Nope, no extra charge at all. The plan limits are based on conversation volume, not domain count.", None),
            ("visitor", "Love it. Thanks!", "happy"),
        ], False),
    ]

    for (vname, vemail, status, channel, conf, res_type, days_ago, msgs, should_escalate) in convos:
        conv_id = uid()
        resolved_at = ts(days_ago=days_ago, hours_ago=1) if status == "resolved" else None

        cur.execute("""
            INSERT INTO conversations (id, tenant_id, visitor_id, visitor_name, visitor_email, status, channel, confidence_avg, resolution_type, metadata, started_at, resolved_at, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, '{}'::jsonb, %s, %s, %s, %s)
        """, (
            conv_id, tenant_id,
            "v_" + uid()[:8], vname, vemail,
            status, channel, conf, res_type,
            ts(days_ago=days_ago, hours_ago=2),
            resolved_at,
            ts(days_ago=days_ago, hours_ago=2),
            ts(days_ago=days_ago, hours_ago=2),
        ))

        for i, (role, content, emotion) in enumerate(msgs):
            cur.execute("""
                INSERT INTO messages (id, conversation_id, tenant_id, role, content, emotion, confidence_score, sources, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, '[]'::jsonb, %s, %s)
            """, (
                uid(), conv_id, tenant_id, role, content, emotion,
                conf if role == "ai" else None,
                ts(days_ago=days_ago, hours_ago=2, minutes_ago=-(i*3)),
                ts(days_ago=days_ago, hours_ago=2, minutes_ago=-(i*3)),
            ))

        if should_escalate:
            cur.execute("""
                INSERT INTO escalations (id, conversation_id, tenant_id, reason, reason_detail, status, priority, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                uid(), conv_id, tenant_id,
                "emotion", "Customer expressed anger about a billing issue",
                "pending", "high",
                ts(days_ago=days_ago, minutes_ago=5),
                ts(days_ago=days_ago, minutes_ago=5),
            ))

    print("✓ Conversations, messages, escalations")

    # ── API Key ────────────────────────────────────────────────────────────
    cur.execute("SELECT id FROM api_keys WHERE tenant_id = %s LIMIT 1", (tenant_id,))
    if not cur.fetchone():
        raw_key = "rslv_demo_" + uid().replace("-","")[:24]
        import hashlib
        hashed = hashlib.sha256(raw_key.encode()).hexdigest()
        cur.execute("""
            INSERT INTO api_keys (id, tenant_id, name, key_prefix, key_hash, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, true, NOW(), NOW())
        """, (uid(), tenant_id, "Widget Key", raw_key[:12], hashed))
        print(f"✓ API key created: {raw_key[:12]}...")
    else:
        print("✓ API key already exists — skipped")

    conn.commit()
    cur.close()
    conn.close()
    print("\n✅ Demo data seeded successfully!")

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else None
    run(email)
