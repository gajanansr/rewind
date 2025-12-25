# 🔄 Rewind - DSA Thinking Recorder

> Train your thinking for technical interviews by recording and reviewing your problem-solving explanations.

## 🎯 What is Rewind?

Rewind is a spaced-repetition learning system designed for DSA interview preparation. Instead of just solving problems, you **record audio explanations** of your approach, then revisit them periodically to reinforce your understanding.

**Core Philosophy:** Interview success comes from *how you think*, not just *what you know*.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React PWA)                     │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐ │
│  │  Login  │ │Dashboard │ │Questions│ │  Solve  │ │ Revisions │ │
│  └────┬────┘ └────┬─────┘ └────┬────┘ └────┬────┘ └─────┬─────┘ │
│       │           │            │           │            │        │
│       └───────────┴────────────┴───────────┴────────────┘        │
│                              │                                    │
│                    ┌─────────▼─────────┐                         │
│                    │   API Client      │                         │
│                    │ + Audio Recorder  │                         │
│                    └─────────┬─────────┘                         │
└──────────────────────────────┼───────────────────────────────────┘
                               │ REST API + JWT
┌──────────────────────────────▼───────────────────────────────────┐
│                      Backend (Spring Boot)                        │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                    Security (JWT + Supabase)                  ││
│  └──────────────────────────────────────────────────────────────┘│
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐ │
│  │ Questions  │ │  Solutions │ │ Recordings │ │   Revisions    │ │
│  │ Controller │ │ Controller │ │ Controller │ │   Controller   │ │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └───────┬────────┘ │
│        │              │              │                │          │
│  ┌─────▼──────────────▼──────────────▼────────────────▼────────┐ │
│  │                    JPA Repositories                          │ │
│  └─────────────────────────┬────────────────────────────────────┘ │
└────────────────────────────┼─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                    Supabase (PostgreSQL)                          │
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │  Users  │ │Questions│ │  Recordings  │ │ Revision Schedule │  │
│  │         │ │ Patterns│ │  Solutions   │ │ Readiness Stats   │  │
│  └─────────┘ └─────────┘ └──────────────┘ └───────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite 7, TanStack Query |
| **Auth** | Supabase Auth (Email/Password) |
| **Backend** | Spring Boot 3.2, Java 17, Lombok |
| **Database** | PostgreSQL (Supabase) |
| **Migrations** | Flyway |
| **State** | Zustand |
| **PWA** | Vite PWA Plugin, Workbox |

---

## 📂 Project Structure

```
rewind/
├── rewind-backend/          # Spring Boot API
│   ├── src/main/java/com/rewind/
│   │   ├── controller/      # 6 REST controllers
│   │   ├── model/           # 13 JPA entities
│   │   ├── repository/      # Data access layer
│   │   ├── service/         # Business logic
│   │   └── config/          # Security, JWT
│   └── src/main/resources/
│       └── db/migration/    # Flyway SQL migrations
│
└── rewind-frontend/         # React PWA
    └── src/
        ├── api/             # API client
        ├── lib/             # Supabase config
        ├── pages/           # 5 page components
        ├── stores/          # Zustand auth store
        └── hooks/           # Audio recorder hook
```

---

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- Supabase account

### Backend
```bash
cd rewind-backend
export JAVA_HOME=/path/to/java17
cp .env.example .env  # Add your Supabase credentials
source .env
mvn spring-boot:run
```

### Frontend
```bash
cd rewind-frontend
cp .env.example .env  # Add Supabase URL and anon key
npm install
npm run dev
```

---

## 📊 Data Model

**Core Entities:**
- `User` - Auth profile synced with Supabase
- `Pattern` - 21 DSA patterns (Two Pointers, Sliding Window, etc.)
- `Question` - 169 curated LeetCode problems
- `UserQuestion` - User's progress on each question
- `Solution` - Submitted code with language
- `ExplanationRecording` - Audio recordings with transcript
- `RevisionSchedule` - Spaced repetition queue
- `ReadinessSnapshot` - Interview readiness tracking

---

## 🎮 Key Features

| Feature | Description |
|---------|-------------|
| **Curated Question Bank** | 169 must-do DSA problems organized by pattern |
| **Audio Recording** | Record your thought process while solving |
| **Spaced Repetition** | Smart revision scheduling based on confidence |
| **Readiness Meter** | "Days to MAANG readiness" tracker |
| **Pattern Filtering** | Filter questions by pattern + difficulty |
| **PWA Support** | Install as app, works offline |

---

## 🔮 Future Scope

### Phase 1 - Core Enhancements
- [ ] **AI Feedback** - Gemini integration for analyzing explanations
- [ ] **Transcript Generation** - Auto-transcribe recordings with Whisper
- [ ] **Progress Analytics** - Charts showing improvement over time
- [ ] **Share Recordings** - Share explanations with study groups

### Phase 2 - Social Features
- [ ] **Study Groups** - Create/join groups for accountability
- [ ] **Leaderboards** - Compete with friends on consistency
- [ ] **Discussion Threads** - Discuss approaches per question
- [ ] **Mock Interviews** - Pair up for practice sessions

### Phase 3 - Advanced
- [ ] **Company-specific Tracks** - Google, Meta, Amazon question sets
- [ ] **Behavioral Questions** - STAR method recorder
- [ ] **Mobile App** - Native iOS/Android with React Native
- [ ] **Browser Extension** - Record directly on LeetCode

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <b>Built with 💜 by Gajanan</b>
</p>
