# ResolvAI

AI-powered customer support agent. Upload your docs, embed a chat widget, and let AI resolve customer questions 24/7.

## Tech Stack

- **Backend**: Python, FastAPI, PostgreSQL, ChromaDB, Celery, Redis
- **Frontend**: Next.js 15, Tailwind CSS, TypeScript
- **Widget**: Preact, Vite (embeddable Shadow DOM widget)
- **AI**: OpenAI GPT-4o-mini + text-embedding-3-small

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (for PostgreSQL + Redis)

### 1. Start databases

```bash
docker-compose up -d
```

### 2. Start the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Set your OpenAI API key
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run migrations
alembic revision --autogenerate -m "initial"
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Build the widget

```bash
cd widget
npm install
npm run dev    # dev server at localhost:5173
npm run build  # produces dist/resolvai.js
```

### 5. Use it

1. Open http://localhost:3000 and sign up
2. Create a Knowledge Base and add some docs
3. Go to API Keys and create a key
4. Go to Install for the widget embed code
5. Test the widget on your site!

## Architecture

```
Customer's Website
    |
    v
[Chat Widget] --WebSocket--> [FastAPI Backend] ---> [OpenAI API]
                                    |                     |
                                    v                     v
                              [PostgreSQL]          [ChromaDB]
                                    |                (vectors)
                                    v
                              [Dashboard]
                             (Next.js App)
```

## Features

- Multi-tenant SaaS (signup, API keys, per-tenant data isolation)
- Knowledge base ingestion (PDF, URL crawling, text/markdown)
- RAG pipeline (chunking, embedding, vector search)
- AI chat with confidence scoring
- Auto-escalation to human agents when AI is unsure
- Real-time WebSocket chat
- Embeddable widget (one line of code)
- Dashboard with conversations, escalations, analytics
- Live chat for human agents

## License

MIT
