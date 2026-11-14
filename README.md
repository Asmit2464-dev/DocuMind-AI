# DevCompass — AI Technical & IT Learning Hub

A full-stack AI research and technical learning platform built with **React, Node.js, Express, MongoDB Atlas, Google Gemini, Tavily Search API, and YouTube Data API v3**.

DevCompass functions as an interactive developer research companion: ask any technical or Computer Science topic, and receive a comprehensive overview, key architectural concepts, live verified documentation, interactive YouTube video tutorials, Indian tech market salary insights, an interactive 4-option quiz, and a phased step-by-step learning roadmap.

> **Project:** DevCompass  
> **Author:** Asmit  
> **Stack:** React (Vite) · Node.js (Express) · MongoDB Atlas · Google Gemini · Tavily Search API · YouTube Data API v3

---

## ✨ Features

### 🧭 Intelligent Research & Query Intent Routing
* **Case 1: Follow-up Questions** (*"explain React more simply"*, *"difference between X and Y"*)
  * Reuses conversation context without re-searching.
  * Fast generation with relevant follow-up suggestion chips.
* **Case 2: New Topics & Resource Queries** (*"what is mern"*, *"show me videos on Docker"*)
  * Concurrently queries **Tavily Search API** (authoritative documentation) and **YouTube Data API v3** (curated tutorial videos).
  * Synthesizes live market salary trends from AmbitionBox, Glassdoor, and industry reports.
  * Formats modular DevCompass research cards.
* **Case 3: Non-Tech / Off-Topic Queries** (*"how do I cook pasta"*)
  * Fast, polite refusal: *"I'm built for tech and IT learning. Want to explore a topic like React, Python, or databases instead?"* with quick-start technical suggestions.

---

### 🎨 Modular DevCompass Research Cards
* **Overview Card**: Detailed breakdown of what the technology is, its architecture, and its real-world purpose, accompanied by technology badges.
* **Key Concepts Card**: 5–6 architectural points covering data flow, prerequisites, gotchas, and production best practices.
* **Videos Card**: Curated tutorial videos with thumbnails and direct links to YouTube. Videos do **not** autoplay on load; clicking any video mounts the embedded YouTube player directly in place with a close button.
* **Docs & Articles Card**: 4–6 live, verified documentation links with domain badges (`react.dev ↗`, `nodejs.org ↗`, `mongodb.com ↗`).
* **Roles & Salary (India) Card**:
  * Role mapping (e.g. *Frontend Developer · Full-Stack Developer · Backend Engineer*).
  * 3 salary tier cards: **Fresher (0–2 yrs)**, **Mid-level (2–5 yrs)**, and **Senior (5+ yrs)** with realistic LPA ranges.
* **Interactive 4-Option Quiz (`A, B, C, D`)**:
  * Practice questions with all 4 options selectable.
  * Instant feedback with green/red badges and explanations.

---

### 🗺️ Multi-Tab Sidebar & Learning Roadmaps
* **🧭 New Topic**: Starts a fresh research thread.
* **3 Segmented Tabs**:
  * **Chats**: Full persistent conversation history with in-place rename and delete actions.
  * **Roadmaps**: Complete phased learning roadmaps (*Foundations ➔ Core Frameworks ➔ Backend & APIs ➔ Production & Deployment ➔ Advanced & Cloud*) plus capstone project ideas.
  * **Summary**: Concise recap of the active chat (*Key Points Learned*, *Resources Mentioned*, and *Next Steps*).
* **Mouse-Stretchable Sidebar**: Click and drag the right edge of the sidebar horizontally to expand or shrink the view (260px to 750px), with preferences saved in `localStorage`.

---

### ⚙️ User Experience & Security
* **Instant Message Rendering**: Prompts appear in the chat stream immediately when sent, followed by a typing indicator and a "Stop generating" button.
* **Difficulty Level Selector**: Toggle between **Beginner**, **Intermediate**, and **Advanced** to tailor explanation depth.
* **Authentication**: Secure JWT-based authentication with bcrypt password hashing and token persistence.
* **Rate Limiting**: Protection against brute-force logins and chat spamming via `express-rate-limit`.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, ReactMarkdown, remark-gfm, rehype-highlight, FontAwesome |
| **Backend** | Node.js (ES Modules), Express 5, Mongoose, JWT, bcrypt, cors, dotenv |
| **Database** | MongoDB Atlas (Cloud Cluster) |
| **AI & APIs** | Google Gemini (`gemini-3.6-flash` with automatic fallback), Tavily Search API, YouTube Data API v3 |
| **Deployment** | Vercel (Frontend), Render (Backend) |

---

## 📂 Project Structure

```text
gpt-ai-chatbot-main/
├── Backend/
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   ├── models/
│   │   ├── Thread.js           # Thread, Message, Summary & Roadmap schema
│   │   └── User.js             # User credentials schema
│   ├── routes/
│   │   ├── auth.js             # Register, login & profile endpoints
│   │   └── chat.js             # Chat, summary & roadmap endpoints
│   ├── utils/
│   │   ├── gemini.js           # Gemini response generation, quiz & fallback
│   │   └── research.js         # Tavily web/salary search & YouTube fetcher
│   ├── .env                    # Backend environment variables
│   ├── package.json
│   └── server.js               # Express server entry point
├── Frontend/
│   ├── src/
│   │   ├── App.jsx             # Main application container & state provider
│   │   ├── Auth.jsx            # Authentication form (login/register)
│   │   ├── Chat.jsx            # DevCompass research cards, quiz & hero UI
│   │   ├── ChatWindow.jsx      # Navbar, level selector & chat input bar
│   │   ├── Sidebar.jsx         # 3-tab sidebar (Chats, Roadmaps, Summary) & resizer
│   │   └── MyContext.jsx       # Context definitions
│   ├── vercel.json             # Vercel SPA client rewrite configuration
│   ├── .env                    # Frontend environment variables
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js v18+ installed
* MongoDB Atlas account or local MongoDB instance
* API Keys for:
  * Google Gemini API Key
  * Tavily Search API Key
  * YouTube Data API v3 Key

### 2. Environment Variables

#### Backend (`Backend/.env`)
```env
PORT=8081
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
TAVILY_API_KEY=your_tavily_api_key
YOUTUBE_API_KEY=your_youtube_api_key
CLIENT_URL=http://localhost:5173
```

#### Frontend (`Frontend/.env`)
```env
VITE_API_URL=http://localhost:8081
```

### 3. Installation & Local Development

1. **Install Backend Dependencies**:
   ```bash
   cd Backend
   npm install
   npm run dev
   ```
   *Backend runs on `http://localhost:8081`.*

2. **Install Frontend Dependencies**:
   ```bash
   cd ../Frontend
   npm install
   npm run dev
   ```
   *Frontend runs on `http://localhost:5173`.*

---

## ☁️ Deployment

### Backend to Render
1. Create a **Web Service** on [Render](https://render.com/).
2. Point to the repository with **Root Directory**: `Backend`.
3. Build Command: `npm install` | Start Command: `npm start`.
4. Add all environment variables (`MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `TAVILY_API_KEY`, `YOUTUBE_API_KEY`, `CLIENT_URL=*`).

### Frontend to Vercel
1. Create a new project on [Vercel](https://vercel.com/) and import the repository.
2. Set **Root Directory** to `Frontend` (Framework preset: `Vite`).
3. Add Environment Variable: `VITE_API_URL` pointing to your deployed Render URL (e.g. `https://devcompass-backend.onrender.com`).
4. Click **Deploy**.

---

## 📄 License
This project is licensed under the MIT License.
