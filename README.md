# Gpt — AI Conversational Chat Application

A full-stack AI chatbot built with **React, Node.js, Express, MongoDB, and Google Gemini**.  
The application provides a ChatGPT-style conversational experience with authentication, persistent chat history, Markdown/code rendering, and backend security controls.

> **Project:** Gpt  
> **Author:** Shuvam  
> **AI:** Google Gemini API

---

## ✨ Features

### 🤖 AI Chat
- Conversational chat powered by Google Gemini
- Multi-turn conversation memory
- Persistent conversations stored in MongoDB
- New chat creation
- Loading state and response animation
- Stop generating / request cancellation
- User-friendly error handling

### 📝 Rich Responses
- Markdown rendering
- GitHub-Flavored Markdown (GFM)
- Tables and strikethrough
- Syntax-highlighted code blocks
- Copy-code button
- Language labels for code blocks

### 🔐 Authentication & Security
- User registration and login
- Password hashing with `bcrypt`
- JWT-based authentication
- JWT validation on application startup
- Automatic logout for invalid/expired tokens
- Protected chat and thread APIs
- Per-user thread ownership
- Cross-user thread access protection
- Input validation and message length limits
- Login/register rate limiting
- Chat rate limiting
- CORS restriction for the frontend origin
- Environment variables for secrets
- Password hashes are never returned to the frontend

### 💬 Chat Management
- Chat history sidebar
- Rename conversations
- Delete conversations with confirmation
- User profile information
- Logout

---

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- React Markdown
- Remark GFM
- Rehype Highlight
- Highlight.js
- React Spinners
- UUID

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- Google Gemini API (`@google/genai`)
- JWT (`jsonwebtoken`)
- bcrypt
- express-rate-limit
- CORS
- dotenv

---

## 📁 Project Structure

```text
Gpt/
├── Backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Thread.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── chat.js
│   ├── utils/
│   │   └── gemini.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
├── Frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Auth.jsx
│   │   ├── Chat.jsx
│   │   ├── ChatWindow.jsx
│   │   ├── MyContext.jsx
│   │   ├── Sidebar.jsx
│   │   └── ...
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## ⚙️ Prerequisites

Install the following before running the project:

- Node.js 18+
- npm
- Docker Desktop
- A Google Gemini API key

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd Gpt
```

### 2. Start MongoDB

The project can use a dedicated Docker MongoDB container on port `27018`, keeping the default MongoDB port `27017` available for other projects.

```bash
docker run -d --name GPT-mongo -p 27018:27017 -v GPT-mongo-data:/data/db mongo:8
```

If the container already exists:

```bash
docker start GPT-mongo
```

### 3. Configure the backend

Go to the backend:

```bash
cd Backend
npm install
```

Create:

```text
Backend/.env
```

using `Backend/.env.example` as a template.

Example:

```env
PORT=8081
MONGODB_URI=mongodb://localhost:27018/sigmagpt
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_random_secret
```

**Never commit the real `.env` file or your API key/JWT secret.**

### 4. Start the backend

From `Backend`:

```bash
npx nodemon server.js
```

The backend should run on:

```text
http://localhost:8081
```

### 5. Configure the frontend

Open another terminal:

```bash
cd Frontend
npm install
```

Create:

```text
Frontend/.env
```

using `Frontend/.env.example`:

```env
VITE_API_URL=http://localhost:8081
```

### 6. Start the frontend

```bash
npm run dev
```

Open the Vite URL shown in the terminal, normally:

```text
http://localhost:5173
```

---

## 🔑 Environment Variables

### Backend

| Variable | Description |
|---|---|
| `PORT` | Backend server port |
| `MONGODB_URI` | MongoDB connection string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `JWT_SECRET` | Secret used to sign and verify JWTs |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |

---

## 🔌 API Overview

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a user account |
| `POST` | `/api/auth/login` | Log in |
| `GET` | `/api/auth/me` | Get the authenticated user |

### Chat & Threads

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Send a message to Gemini |
| `GET` | `/api/thread` | Get the current user's threads |
| `GET` | `/api/thread/:threadId` | Get messages for a thread |
| `PATCH` | `/api/thread/:threadId` | Rename a thread |
| `DELETE` | `/api/thread/:threadId` | Delete a thread |

Protected endpoints require:

```http
Authorization: Bearer <JWT>
```

---

## 🧠 Conversation Flow

```text
User
  │
  ▼
React Frontend
  │
  │ JWT + message
  ▼
Express API
  │
  ├── Authentication / authorization
  ├── Input validation
  ├── Rate limiting
  │
  ▼
MongoDB
  │
  │ Conversation history
  ▼
Gemini API
  │
  ▼
Assistant response
  │
  ▼
MongoDB + React UI
```

The complete thread history is supplied to Gemini so the assistant can maintain context throughout a conversation.

---

## 🔒 Security Notes

This project includes several application-level security measures:

- Passwords are hashed before database storage.
- JWTs protect authenticated API routes.
- Thread queries include the authenticated user's ID.
- Users cannot rename, read, or delete another user's thread through the protected routes.
- Authentication and chat endpoints are rate-limited.
- Request input is validated and length-limited.
- Internal server errors are logged server-side while generic messages are returned to clients.
- Secrets are stored in environment variables rather than source code.
- CORS is restricted to the local frontend origin during development.

For production deployment, additional hardening should be considered, including HTTPS, secure cookie-based authentication where appropriate, production CORS configuration, stronger operational logging/monitoring, and deployment-specific secret management.

---

## 🧪 Recommended Test Flow

After starting the application:

1. Register a new account.
2. Log in.
3. Send a chat message.
4. Ask a follow-up question to verify conversation memory.
5. Refresh the page and verify chat history remains.
6. Create a new chat.
7. Rename a conversation.
8. Delete a conversation and confirm the dialog.
9. Log out.
10. Log in again.
11. Verify protected endpoints reject requests without a valid JWT.

---



## 📌 Future Improvements

Possible future enhancements include:

- Production deployment
- Secure HttpOnly cookie authentication
- Streaming Gemini responses
- Chat search
- Regenerate response
- Responsive mobile sidebar
- Theme customization
- File/image uploads
- Voice input
- Usage/account settings

---

## 👨‍💻 Author

**Shuvam**

Built as a full-stack AI chatbot project to demonstrate:

- React development
- REST API development
- Authentication and authorization
- MongoDB data modeling
- Third-party AI API integration
- Backend security
- Modern frontend UX

---
