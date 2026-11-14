import "./Sidebar.css";
import {
    useContext,
    useEffect,
    useState,
    useCallback
} from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function Sidebar() {
    const {
        allThreads,
        setAllThreads,
        currThreadId,
        setNewChat,
        setPrompt,
        setReply,
        setCurrThreadId,
        setPrevChats,
        prevChats,
        activeTab,
        setActiveTab,
        threadRoadmap,
        setThreadRoadmap,
        threadSummary,
        setThreadSummary
    } = useContext(MyContext);

    const [editingThreadId, setEditingThreadId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [roadmapLoading, setRoadmapLoading] = useState(false);
    const [summaryCopied, setSummaryCopied] = useState(false);
    const [roadmapCopied, setRoadmapCopied] = useState(false);

    // Dynamic resizable sidebar width
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem("sidebarWidth");
        return saved ? parseInt(saved, 10) : 300;
    });
    const [isResizing, setIsResizing] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

    // Get all threads
    const getAllThreads = useCallback(async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/thread`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const res = await response.json();

            if (!response.ok) {
                throw new Error(res.error || "Failed to fetch threads");
            }

            const filteredData = res.map((thread) => ({
                threadId: thread.threadId,
                title: thread.title,
                summary: thread.summary || "",
                roadmap: thread.roadmap || ""
            }));

            setAllThreads(filteredData);

        } catch (err) {
            console.log("Failed to fetch threads:", err);
        }
    }, [API_URL, setAllThreads]);

    useEffect(() => {
        getAllThreads();
    }, [currThreadId, getAllThreads]);

    // Fetch summary and roadmap for a thread
    const fetchThreadDetails = useCallback(async (threadId) => {
        try {
            const [sumRes, roadRes] = await Promise.allSettled([
                fetch(`${API_URL}/api/thread/${threadId}/summary`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                }),
                fetch(`${API_URL}/api/thread/${threadId}/roadmap`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                })
            ]);

            if (sumRes.status === "fulfilled" && sumRes.value.ok) {
                const data = await sumRes.value.json();
                setThreadSummary(data.summary || "");
            }

            if (roadRes.status === "fulfilled" && roadRes.value.ok) {
                const data = await roadRes.value.json();
                setThreadRoadmap(data.roadmap || "");
            }
        } catch (err) {
            console.log("Failed to fetch thread details:", err);
        }
    }, [API_URL, setThreadSummary, setThreadRoadmap]);

    // Create new topic / chat
    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
        setEditingThreadId(null);
        setEditTitle("");
        setThreadSummary("");
        setThreadRoadmap("");
        setActiveTab("chats");
    };

    // Open existing thread
    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);

        try {
            const response = await fetch(
                `${API_URL}/api/thread/${newThreadId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const res = await response.json();

            if (!response.ok) {
                throw new Error(res.error || "Failed to fetch chat");
            }

            setPrevChats(res);
            setNewChat(false);
            setReply(null);
            fetchThreadDetails(newThreadId);

        } catch (err) {
            console.log("Failed to load chat:", err);
        }
    };

    // Delete thread
    const deleteThread = async (threadId) => {
        const confirmed = window.confirm("Are you sure you want to delete this topic?");
        if (!confirmed) return;

        try {
            const response = await fetch(
                `${API_URL}/api/thread/${threadId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            if (response.ok) {
                setAllThreads((prev) => prev.filter((t) => t.threadId !== threadId));
                if (threadId === currThreadId) {
                    createNewChat();
                }
            }
        } catch (err) {
            console.log("Failed to delete thread:", err);
        }
    };

    // Rename thread
    const renameThread = async (threadId) => {
        const title = editTitle.trim();
        if (!title) return;

        try {
            const response = await fetch(
                `${API_URL}/api/thread/${threadId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({ title })
                }
            );

            const res = await response.json();

            if (response.ok) {
                setAllThreads((prev) =>
                    prev.map((t) =>
                        t.threadId === threadId ? { ...t, title: res.thread.title } : t
                    )
                );
                setEditingThreadId(null);
                setEditTitle("");
            }
        } catch (err) {
            console.log("Failed to rename thread:", err);
        }
    };

    // Start renaming
    const startRenaming = (thread) => {
        setEditingThreadId(thread.threadId);
        setEditTitle(thread.title);
    };

    // Generate short summary (Key points, resources, next steps)
    const handleGenerateSummary = async () => {
        if (!prevChats || prevChats.length === 0) {
            alert("Start a conversation first before generating a summary.");
            return;
        }

        setSummaryLoading(true);
        try {
            const response = await fetch(
                `${API_URL}/api/thread/${currThreadId}/summary`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const data = await response.json();
            if (response.ok && data.summary) {
                setThreadSummary(data.summary);
            }
        } catch (err) {
            console.error("Summary error:", err);
        } finally {
            setSummaryLoading(false);
        }
    };

    // Generate roadmap
    const handleGenerateRoadmap = async () => {
        if (!prevChats || prevChats.length === 0) {
            alert("Start a conversation first before generating a roadmap.");
            return;
        }

        setRoadmapLoading(true);
        try {
            const response = await fetch(
                `${API_URL}/api/thread/${currThreadId}/roadmap`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const data = await response.json();
            if (response.ok && data.roadmap) {
                setThreadRoadmap(data.roadmap);
            }
        } catch (err) {
            console.error("Roadmap error:", err);
        } finally {
            setRoadmapLoading(false);
        }
    };

    const copyText = async (text, setCopiedState) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedState(true);
            setTimeout(() => setCopiedState(false), 1500);
        } catch (e) {
            console.log("Failed to copy:", e);
        }
    };

    // Mouse resize drag handlers
    const startResizing = useCallback((e) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e) => {
            const maxWidth = Math.min(750, window.innerWidth * 0.65);
            const newWidth = Math.max(260, Math.min(e.clientX, maxWidth));
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        };
    }, [isResizing]);

    useEffect(() => {
        localStorage.setItem("sidebarWidth", sidebarWidth);
    }, [sidebarWidth]);

    return (
        <section
            className={`sidebar ${isResizing ? "resizing" : ""}`}
            style={{ width: `${sidebarWidth}px` }}
        >
            {/* New Topic Button */}
            <button className="newTopicBtn" onClick={createNewChat} title="Start new topic">
                <i className="fa-regular fa-compass newTopicIcon"></i>
                <span className="newTopicText">New topic</span>
            </button>

            {/* 3 Tabs: Chats | Roadmaps | Summary */}
            <div className="sidebarTabsContainer">
                <button
                    className={`tabSegment ${activeTab === "chats" ? "tabSegmentActive" : ""}`}
                    onClick={() => setActiveTab("chats")}
                >
                    Chats
                </button>
                <button
                    className={`tabSegment ${activeTab === "roadmaps" ? "tabSegmentActive" : ""}`}
                    onClick={() => {
                        setActiveTab("roadmaps");
                        if (!threadRoadmap && currThreadId) {
                            fetchThreadDetails(currThreadId);
                        }
                    }}
                >
                    Roadmaps
                </button>
                <button
                    className={`tabSegment ${activeTab === "summary" ? "tabSegmentActive" : ""}`}
                    onClick={() => {
                        setActiveTab("summary");
                        if (!threadSummary && currThreadId) {
                            fetchThreadDetails(currThreadId);
                        }
                    }}
                >
                    Summary
                </button>
            </div>

            {/* Content per Tab */}
            <div className="sidebarContent">
                {activeTab === "chats" && (
                    <ul className="history">
                        {allThreads?.map((thread) => (
                            <li
                                key={thread.threadId}
                                onClick={() => {
                                    if (editingThreadId !== thread.threadId) {
                                        changeThread(thread.threadId);
                                    }
                                }}
                                className={thread.threadId === currThreadId ? "highlighted" : ""}
                            >
                                {editingThreadId === thread.threadId ? (
                                    <input
                                        className="renameInput"
                                        value={editTitle}
                                        autoFocus
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") renameThread(thread.threadId);
                                            if (e.key === "Escape") {
                                                setEditingThreadId(null);
                                                setEditTitle("");
                                            }
                                        }}
                                    />
                                ) : (
                                    <span className="threadTitle">{thread.title}</span>
                                )}

                                {editingThreadId === thread.threadId ? (
                                    <i
                                        className="fa-solid fa-check renameSave"
                                        title="Save"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            renameThread(thread.threadId);
                                        }}
                                    ></i>
                                ) : (
                                    <>
                                        <i
                                            className="fa-solid fa-pen renameIcon"
                                            title="Rename"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startRenaming(thread);
                                            }}
                                        ></i>
                                        <i
                                            className="fa-solid fa-trash trashIcon"
                                            title="Delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteThread(thread.threadId);
                                            }}
                                        ></i>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {activeTab === "roadmaps" && (
                    <div className="tabViewPanel">
                        <div className="tabViewHeader">
                            <span className="panelHeading">
                                <i className="fa-solid fa-route"></i> Topic Roadmap
                            </span>
                            {threadRoadmap && (
                                <button
                                    className="copyBtn"
                                    onClick={() => copyText(threadRoadmap, setRoadmapCopied)}
                                >
                                    <i className={roadmapCopied ? "fa-solid fa-check" : "fa-regular fa-copy"}></i>
                                    {roadmapCopied ? " Copied" : " Copy"}
                                </button>
                            )}
                        </div>

                        <div className="tabViewBody">
                            {roadmapLoading ? (
                                <div className="panelLoading">
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                    <p>Building phased learning roadmap...</p>
                                </div>
                            ) : threadRoadmap ? (
                                <div className="renderedMarkdown">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {threadRoadmap}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="panelEmptyState">
                                    <i className="fa-solid fa-map-location-dot emptyIcon"></i>
                                    <p>Generate a complete step-by-step learning roadmap with prerequisites, core frameworks, backend, deployment, and capstone projects.</p>
                                </div>
                            )}
                        </div>

                        <button
                            className="primaryActionBtn"
                            onClick={handleGenerateRoadmap}
                            disabled={roadmapLoading || !prevChats || prevChats.length === 0}
                        >
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                            {roadmapLoading ? "Building..." : threadRoadmap ? "Update Roadmap" : "Make Roadmap"}
                        </button>
                    </div>
                )}

                {activeTab === "summary" && (
                    <div className="tabViewPanel">
                        <div className="tabViewHeader">
                            <span className="panelHeading">
                                <i className="fa-solid fa-list-check"></i> Chat Summary
                            </span>
                            {threadSummary && (
                                <button
                                    className="copyBtn"
                                    onClick={() => copyText(threadSummary, setSummaryCopied)}
                                >
                                    <i className={summaryCopied ? "fa-solid fa-check" : "fa-regular fa-copy"}></i>
                                    {summaryCopied ? " Copied" : " Copy"}
                                </button>
                            )}
                        </div>

                        <div className="tabViewBody">
                            {summaryLoading ? (
                                <div className="panelLoading">
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                    <p>Summarizing key points, resources & next steps...</p>
                                </div>
                            ) : threadSummary ? (
                                <div className="renderedMarkdown">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {threadSummary}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="panelEmptyState">
                                    <i className="fa-solid fa-file-lines emptyIcon"></i>
                                    <p>Get a short summary of this chat: key points learned, resources mentioned, and next steps.</p>
                                </div>
                            )}
                        </div>

                        <button
                            className="primaryActionBtn"
                            onClick={handleGenerateSummary}
                            disabled={summaryLoading || !prevChats || prevChats.length === 0}
                        >
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                            {summaryLoading ? "Summarizing..." : threadSummary ? "Update Summary" : "Summarize Chat"}
                        </button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="sign">
                <p>Built by Asmit</p>
            </div>

            {/* Mouse Resizer Handle */}
            <div
                className="sidebarResizer"
                onMouseDown={startResizing}
                title="Drag horizontally to resize sidebar width"
            >
                <div className="resizerGrip"></div>
            </div>
        </section>
    );
}

export default Sidebar;
