import './App.css';
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import { MyContext } from "./MyContext.jsx";
import { useState, useEffect } from 'react';
import { v1 as uuidv1 } from "uuid";
import Auth from "./Auth.jsx";

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [level, setLevel] = useState("Beginner"); // "Beginner" | "Intermediate" | "Advanced"
  const [activeTab, setActiveTab] = useState("chats"); // "chats" | "roadmaps" | "summary"
  const [threadRoadmap, setThreadRoadmap] = useState("");
  const [threadSummary, setThreadSummary] = useState("");

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  const [authLoading, setAuthLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
        setAuthLoading(false);
        return;
    }

    fetch(`${API_URL}/api/auth/me`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    .then(async (response) => {
        if (!response.ok) {
            throw new Error("Invalid or expired token");
        }

        return response.json();
    })
    .then((data) => {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
    })
    .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    })
    .finally(() => {
        setAuthLoading(false);
    });
}, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const handleMakeRoadmap = async () => {
    setActiveTab("roadmaps");
    try {
        const response = await fetch(`${API_URL}/api/thread/${currThreadId}/roadmap`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            setThreadRoadmap(data.roadmap || "");
        }
    } catch (err) {
        console.error("Failed to generate roadmap:", err);
    }
  };

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    level, setLevel,
    activeTab, setActiveTab,
    threadRoadmap, setThreadRoadmap,
    threadSummary, setThreadSummary,
    handleMakeRoadmap,
    user,
    handleLogout
  };

  if (authLoading) {
    return <div style={{ color: "#fff", display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Loading...</div>;
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className='app'>
      <MyContext.Provider value={providerValues}>
        <Sidebar />
        <ChatWindow />
      </MyContext.Provider>
    </div>
  );
}

export default App;
