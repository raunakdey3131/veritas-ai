# Veritas AI — Demo Recording Guide

## 🎬 How to Record Your Demo Video

### Tools Needed
- **OBS Studio** (free) — https://obsproject.com
- Or **Loom** / **Screen Studio** / **QuickTime Player**

### Setup
1. Open `demo/presentation.html` in your browser (fullscreen, F11)
2. Open http://localhost:5173 in another window
3. Have the Chrome Extension `extension/` folder ready to load

---

## 🎙️ Narration Script by Slide

### Slide 0 — Title (15s)
> *"Welcome to Veritas AI — a production-grade hallucination detection platform. In this demo, I'll show you how it detects, scores, and explains AI hallucinations in real time."*

### Slide 1 — Problem & Solution (30s)
> *"AI hallucinations are a critical problem. LLMs confidently generate false information — invented dates, fake citations, impossible facts. This costs millions in healthcare, legal, and finance. Veritas AI solves this with a multi-stage verification pipeline that catches these errors before they cause damage."*

### Slide 2 — Architecture (40s)
> *"Here's the architecture: 12 microservices working together. Claim extraction with spaCy, knowledge retrieval across vector and graph databases, NLI verification with RoBERTa, citation validation, contradiction detection, and risk scoring — all behind a gateway with auth, rate limiting, circuit breaking, and full OpenTelemetry observability."*

### Slide 3 — Web Dashboard (45s)
> **[Switch to http://localhost:5173]**
> *"Let me show you the live dashboard. Type any claim, hit verify, and watch the pipeline process it step-by-step. Here we see the hallucination score from 0 to 100, the interactive knowledge graph showing evidence relationships, and the risk gauge animating in real-time."*

### Slide 4 — 3D Cat Assistant (30s)
> *"Meet the 3D cat assistant — a fully animated Three.js chibi cat with headphones. It reacts to verification results: ears perk up for reliable facts, alarm for hallucinations. It features ear flop, tail wag, blinking, breathing, happy sway, and tongue blep — all at 60fps."*

### Slide 5 — Chrome Extension (45s)
> **[Switch to Chrome with extension loaded]**
> *"The Chrome Extension brings verification everywhere. Right-click any selected text to check for hallucinations. A pixel-cute canvas desktop pet with eye tracking follows your cursor and shows speech bubbles. The popup provides instant verification with local fallback when offline."*

### Slide 6 — Live Demos (40s)
> *"Let's test it. 'Google was founded in 1908' — score 88, highly hallucinated. 'Python was created in 1991 by Guido van Rossum' — verified reliable. 'The moon is made of cheese' — hallucinated. The system detects false claims about dates, speeds, populations, and more, with clear explanations every time."*

### Slide 7 — Tech Deep Dive (30s)
> *"Under the hood: React 19 with Vite and TypeScript, Three.js for 3D rendering, 12 FastAPI microservices with OpenTelemetry tracing, ML models including RoBERTa NLI and DeBERTa-v3, PostgreSQL with partitioning for 100M+ records, Neo4j knowledge graphs, Docker and Kubernetes with auto-scaling, and full CI/CD pipelines."*

### Slide 8 — Closing (20s)
> *"Veritas AI is fully open source — check the live demo and GitHub repo. I built this to detect AI hallucinations at scale, from Chrome extensions to enterprise Kubernetes. I'm excited to bring this level of AI safety engineering to your team."*

---

## 📋 Recording Checklist

- [ ] Record at **1920×1080 @ 30fps** or higher
- [ ] Clean desktop background
- [ ] Close notifications and distractions
- [ ] Have the live app ready at http://localhost:5173
- [ ] Chrome Extension loaded (chrome://extensions → Load unpacked → `extension/`)
- [ ] Backend running on port 8000 (`python -m uvicorn server:app --port 8000`)
- [ ] Test your audio level before recording
- [ ] Mute system sounds
- [ ] Record in short segments if needed (edit together later)

## ✂️ Post-Processing Tips

- Add **subtle background music** (epidemic sound, artlist)
- Use **Ken Burns effect** (slow zoom) on static slides
- Add **call-out captions** for key metrics
- End with your **contact info / LinkedIn** overlay
- Keep total under **4 minutes**

## 🔗 Links for Video Description

```
Live Demo: https://frontend-five-rho-19cmzgi7i2.vercel.app
Source Code: https://github.com/raunakdey3131/veritas-ai
Tech Stack: React · Three.js · FastAPI · Python · Docker · K8s
```
