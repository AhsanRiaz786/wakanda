# CityIRA (City Incident-to-Response Routing Agent)

**Google Antigravity Hackathon Submission — Challenge 1.**

CityIRA is an autonomous content-to-action system for synthetic city operations. It ingests fragmented incident signals (via text or live voice commands), plans coordinated responses using **LangGraph** agents, simulates outcomes, and provides transparent reasoning traces inside a React Native mobile ops dashboard.

---

## 🏗️ Architecture Stack

- **Orchestration**: FastAPI + LangGraph
- **Core Intelligence**: Groq (`llama-3.3-70b-versatile`) for classification, conflict resolution, and notification drafting.
- **Voice Pipeline**: 
  - **STT (Speech-to-Text)**: Deepgram
  - **Intent & Summarization**: Groq
  - **TTS (Text-to-Speech)**: ElevenLabs (Gracefully degrades to text-only if out of credits)
- **Frontend**: Expo React Native (Presentation UI)

---

## ⚙️ Quick Start Guide

### 1. Backend Setup

First, navigate to the backend directory and synchronize the Python dependencies using `uv`.

```bash
cd backend
uv sync
```

**Environment Variables**
Create a `.env` file in the `backend/` directory by copying the example:
```bash
cp .env.example .env
```

Open `.env` and configure your API keys. Make sure you set the following:
```env
# Core LLM Engine
LLM_MODEL=llama-3.3-70b-versatile
MOCK_LLM=false

# API Keys
GROQ_API_KEY=your_groq_key_here
DEEPGRAM_API_KEY=your_deepgram_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

**Run the Server**
Seed the mock database and start the Uvicorn server:
```bash
uv run python scripts/seed_demo_incidents.py
uv run uvicorn app.main:app --reload --port 8000
```
- API Docs: http://localhost:8000/docs
- API Base URL: http://localhost:8000/v1

### 2. Testing the Backend

You can easily verify that the core LangGraph agent is communicating properly with Groq by running the automated smoke test script:

```bash
cd backend
./scripts/smoke_test.sh
```
*This will simulate 6 simultaneous city incidents and run them through the full Triage and Plan graph.*

**Test Voice Pipeline (Audio)**
You can also test the voice pipeline manually using `curl`:
```bash
curl -X POST -F "audio=@emergency.wav;type=audio/wav" http://localhost:8000/v1/voice
```

### 3. Mobile App Setup

The frontend is a lightweight React Native dashboard built with Expo.

```bash
cd mobile
npm install
```

**Environment Variables**
Create a `.env` file in the `mobile/` directory:
```bash
cp .env.example .env
```
Update `EXPO_PUBLIC_API_BASE_URL` inside `.env` to point to your backend. 
> **Note**: If you are testing on a physical iOS/Android device via the Expo Go app, you must use your computer's local LAN IP address (e.g., `http://192.168.1.15:8000/v1`), NOT `localhost`.

**Run the App**
```bash
npm start
```
Scan the QR code with the Expo Go app on your phone, or press `i` to open in the iOS Simulator.

---

## 📂 Documentation

| Document | Purpose |
|----------|---------|
| [plan.md](./plan.md) | Full PRD + technical specification |
| [planmvp.md](./planmvp.md) | MVP build guide + Antigravity artifact manifest |
| [AGENTS.md](./AGENTS.md) | Instructions for AI coding agents |

---

## 🏆 Antigravity Hackathon Proof
- **Built with**: Google Antigravity IDE
- **IDE Artifacts**: Proof of pair-programming can be found in `docs/antigravity/`
- **Runtime Logs**: Extracted LangGraph reasoning traces can be found in `docs/evidence/`
