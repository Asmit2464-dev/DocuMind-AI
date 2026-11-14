import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState } from "react";

function ChatWindow() {
    const {
        prompt,
        setPrompt,
        setReply,
        currThreadId,
        setPrevChats,
        setNewChat,
        handleLogout,
        user,
        level,
        setLevel
    } = useContext(MyContext);

    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [controller, setController] = useState(null);

    const getReply = async (customMessage) => {
        const messageToSend = typeof customMessage === "string" ? customMessage : prompt;
        if (!messageToSend.trim() || loading) {
            return;
        }

        // 1. Instantly display user prompt in chat stream
        setPrevChats(prev => [
            ...prev,
            { role: "user", content: messageToSend }
        ]);
        setPrompt("");
        setNewChat(false);
        setLoading(true);

        const newController = new AbortController();
        setController(newController);

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({
                message: messageToSend,
                threadId: currThreadId,
                level: level || "Beginner"
            })
        };

        try {
            const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";
            const response = await fetch(
                `${API_URL}/api/chat`,
                {
                    ...options,
                    signal: newController.signal
                }
            );
            const res = await response.json();

            // 2. Append assistant response directly to chat stream
            setPrevChats(prev => [
                ...prev,
                { role: "assistant", content: res.reply, meta: res.meta }
            ]);
            setReply(res.reply);
        } catch (err) {
            if (err.name === "AbortError") {
                console.log("Generation stopped by user.");
            } else {
                console.log(err);
                const errorPayload = {
                    type: "followup",
                    text: "Sorry, I couldn't generate a response right now. Please try again.",
                    suggestions: ["Retry", "Ask another topic"]
                };
                setPrevChats(prev => [
                    ...prev,
                    { role: "assistant", content: JSON.stringify(errorPayload), meta: errorPayload }
                ]);
            }
        } finally {
            setLoading(false);
            setController(null);
        }
    };

    const handleStop = () => {
        if (controller) {
            controller.abort();
        }
    };

    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    };

    const userInitial = user?.name ? user.name[0].toUpperCase() : "A";

    return (
        <div className="chatWindow">
            {/* Top Navbar */}
            <div className="navbar">
                <div className="navbarBrand">
                    Dev <span className="brandHighlight">Compass</span>
                </div>

                <div className="userIconDiv" onClick={handleProfileClick} title={user?.name || "User Profile"}>
                    <div className="userAvatarBadge">
                        {userInitial}
                    </div>
                </div>
            </div>

            {/* Profile Dropdown */}
            {isOpen && (
                <div className="dropDown">
                    <div className="profileInfo">
                        <div className="profileAvatar">
                            {userInitial}
                        </div>
                        <div className="profileDetails">
                            <div className="profileName">
                                {user?.name || "Developer"}
                            </div>
                            <div className="profileEmail">
                                {user?.email}
                            </div>
                        </div>
                    </div>

                    <div className="dropDownDivider"></div>

                    <div
                        className="dropDownItem logoutItem"
                        onClick={handleLogout}
                    >
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        <span>Log out</span>
                    </div>
                </div>
            )}

            {/* Main Chat Area */}
            <Chat
                loading={loading}
                onStopGenerating={handleStop}
                onSendSuggestion={(text) => getReply(text)}
            />

            {/* Bottom Input Area */}
            <div className="chatInput">
                {/* Level selector */}
                <div className="levelSelector">
                    <span className="levelLabel">Level:</span>
                    {["Beginner", "Intermediate", "Advanced"].map((lvl) => (
                        <button
                            key={lvl}
                            type="button"
                            className={`levelPill ${level === lvl ? "levelPillActive" : ""}`}
                            onClick={() => setLevel(lvl)}
                        >
                            {lvl}
                        </button>
                    ))}
                </div>

                {/* Input box */}
                <div className="inputBox">
                    <input
                        placeholder='Ask about any tech topic, e.g. "Learn React" or "What is Kubernetes?"'
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && prompt.trim() && !loading) {
                                getReply();
                            }
                        }}
                    />
                    <button
                        id="submit"
                        type="button"
                        onClick={() => getReply()}
                        disabled={loading || !prompt.trim()}
                    >
                        Ask
                    </button>
                </div>

                <p className="info">
                    Links come from live search results. Check important details before relying on them.
                </p>
            </div>
        </div>
    );
}

export default ChatWindow;
