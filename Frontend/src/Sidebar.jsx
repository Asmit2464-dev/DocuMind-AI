import "./Sidebar.css";
import {
    useContext,
    useEffect,
    useState,
    useCallback
} from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";

function Sidebar() {
    const {
        allThreads,
        setAllThreads,
        currThreadId,
        setNewChat,
        setPrompt,
        setReply,
        setCurrThreadId,
        setPrevChats
    } = useContext(MyContext);

    const [editingThreadId, setEditingThreadId] = useState(null);
    const [editTitle, setEditTitle] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;

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
                throw new Error(
                    res.error || "Failed to fetch threads"
                );
            }

            const filteredData = res.map((thread) => ({
                threadId: thread.threadId,
                title: thread.title
            }));

            setAllThreads(filteredData);

        } catch (err) {
            console.log("Failed to fetch threads:", err);
        }
    }, [API_URL, setAllThreads]);

    useEffect(() => {
        getAllThreads();
    }, [currThreadId, getAllThreads]);

    // Create new chat
    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
        setEditingThreadId(null);
        setEditTitle("");
    };

    // Open an existing thread
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
                throw new Error(
                    res.error || "Failed to fetch chat"
                );
            }

            setPrevChats(res);
            setNewChat(false);
            setReply(null);

        } catch (err) {
            console.log("Failed to load chat:", err);
        }
    };

    // Delete thread
    const deleteThread = async (threadId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this chat?"
        );

        if (!confirmed) {
            return;
        }

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

            const res = await response.json();

            if (!response.ok) {
                throw new Error(
                    res.error || "Failed to delete thread"
                );
            }

            setAllThreads((prev) =>
                prev.filter(
                    (thread) => thread.threadId !== threadId
                )
            );

            if (threadId === currThreadId) {
                createNewChat();
            }

        } catch (err) {
            console.log("Failed to delete thread:", err);
        }
    };

    // Rename thread
    const renameThread = async (threadId) => {
        const title = editTitle.trim();

        if (!title) {
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/thread/${threadId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        title
                    })
                }
            );

            const res = await response.json();

            if (!response.ok) {
                throw new Error(
                    res.error || "Failed to rename thread"
                );
            }

            setAllThreads((prev) =>
                prev.map((thread) =>
                    thread.threadId === threadId
                        ? {
                              ...thread,
                              title: res.thread.title
                          }
                        : thread
                )
            );

            setEditingThreadId(null);
            setEditTitle("");

        } catch (err) {
            console.log("Failed to rename thread:", err);
        }
    };

    // Start editing a thread
    const startRenaming = (thread) => {
        setEditingThreadId(thread.threadId);
        setEditTitle(thread.title);
    };

    return (
        <section className="sidebar">

            {/* New Chat button */}
            <button onClick={createNewChat}>
                <img
                    src="src/assets/blacklogo.png"
                    alt="gpt logo"
                    className="logo"
                />

                <span>
                    <i className="fa-solid fa-pen-to-square"></i>
                </span>
            </button>

            {/* Chat history */}
            <ul className="history">
                {allThreads?.map((thread) => (
                    <li
                        key={thread.threadId}
                        onClick={() => {
                            if (
                                editingThreadId !==
                                thread.threadId
                            ) {
                                changeThread(thread.threadId);
                            }
                        }}
                        className={
                            thread.threadId === currThreadId
                                ? "highlighted"
                                : ""
                        }
                    >

                        {/* Thread title / rename input */}
                        {editingThreadId === thread.threadId ? (
                            <input
                                className="renameInput"
                                value={editTitle}
                                autoFocus
                                onChange={(e) =>
                                    setEditTitle(e.target.value)
                                }
                                onClick={(e) =>
                                    e.stopPropagation()
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        renameThread(
                                            thread.threadId
                                        );
                                    }

                                    if (e.key === "Escape") {
                                        setEditingThreadId(null);
                                        setEditTitle("");
                                    }
                                }}
                            />
                        ) : (
                            <span className="threadTitle">
                                {thread.title}
                            </span>
                        )}

                        {/* Action buttons */}
                        {editingThreadId === thread.threadId ? (
                            <i
                                className="fa-solid fa-check renameSave"
                                title="Save"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    renameThread(
                                        thread.threadId
                                    );
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
                                    className="fa-solid fa-trash"
                                    title="Delete"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteThread(
                                            thread.threadId
                                        );
                                    }}
                                ></i>
                            </>
                        )}

                    </li>
                ))}
            </ul>

            {/* Footer */}
            <div className="sign">
                <p>By Asmit &hearts;</p>
            </div>

        </section>
    );
}

export default Sidebar;