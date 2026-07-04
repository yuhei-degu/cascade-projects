# Market Discovery AI

Market Discovery AI is an opportunity-ranking dashboard for deciding what to build before handing work to an AI coding agent.

The current MVP focuses on a small but useful loop:

1. Collect market signals and research notes.
2. Score opportunities by demand, monetization, competition, and build difficulty.
3. Turn the highest-ranked opportunity into MVP scope and risks.
4. Use the result as the input layer for an AI development OS.

## Run

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

The frontend includes fallback demo data, so it can render even when the API is not running.

## API

- `GET /api/v1/themes`
- `GET /api/v1/themes/{id}`
- `GET /api/v1/categories`
- `POST /api/v1/ingest`
- `GET /api/v1/brief`
- `GET /api/v1/health`

## Scoring

```text
business_index =
  demand_score * 0.40
  + monetization_score * 0.30
  + (100 - competition_score) * 0.20
  + (100 - dev_difficulty_score) * 0.10
```

Lower competition and lower development difficulty improve the index.

## Current Product Direction

The strongest self-referential opportunity is a "Research-to-MVP planner for indie builders": use Market Discovery AI itself to find, score, scope, and validate the next app before code generation begins.

## AI Company OS Department Role

Market Discovery AI also acts as an internal department for AI Company OS.

- Source of new development ideas
- Opportunity scoring and MVP slicing
- Validation plan generation
- Next project brief creation
- Safe queue candidate preparation

Department outputs:

- `OPPORTUNITY_PIPELINE.md`
- `MVP_CANDIDATES.md`
- `VALIDATION_PLANS.md`
- `NEXT_PROJECT_BRIEFS.md`
