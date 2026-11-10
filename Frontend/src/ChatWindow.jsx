import "./ChatWindow.css";

import Chat from "./Chat.jsx";

import { MyContext } from "./MyContext.jsx";

import { useContext, useState, useEffect } from "react";

import { ScaleLoader } from "react-spinners";

function ChatWindow() {
    const {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setPrevChats,
    setNewChat,
    handleLogout,
    user
} = useContext(MyContext);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [controller, setController] = useState(null);

    const getReply = async () => {
    if (!prompt.trim() || loading) {
        return;
    }

    setLoading(true);
    const newController = new AbortController();
setController(newController);
        setNewChat(false);

        console.log("message ", prompt, " threadId ", currThreadId);
        const options = {
            method: "POST",
            headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`
},
            body: JSON.stringify({
                message: prompt,
                threadId: currThreadId
            })
        };

        try {
            const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/chat`,
    {
        ...options,
        signal: newController.signal
    }
);
            const res = await response.json();
            console.log(res);
            setReply(res.reply);
        } catch (err) {
    if (err.name === "AbortError") {
        console.log("Generation stopped by user.");
    } else {
        console.log(err);

        setReply(
            "Sorry, I couldn't generate a response right now. Please try again."
        );
    }
}
setLoading(false);
setController(null);
    }

    //Append new chat to prevChats
    useEffect(() => {
        if(prompt && reply) {
            setPrevChats(prevChats => (
                [...prevChats, {
                    role: "user",
                    content: prompt
                },{
                    role: "assistant",
                    content: reply
                }]
            ));
        }

        setPrompt("");
    }, [reply]);


    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    }

    return (
        <div className="chatWindow">
            <div className="navbar">
                <span>GPT <i className="fa-solid fa-chevron-down"></i></span>
                <div className="userIconDiv" onClick={handleProfileClick}>
                    <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                </div>
            </div>
            {
    isOpen &&
    <div className="dropDown">

        <div className="profileInfo">
            <div className="profileName">
                {user?.name}
            </div>

            <div className="profileEmail">
                {user?.email}
            </div>
        </div>

        <div className="dropDownItem">
            <i className="fa-solid fa-gear"></i>
            Settings
        </div>

        <div className="dropDownItem">
            <i className="fa-solid fa-cloud-arrow-up"></i>
            Upgrade plan
        </div>

        <div
            className="dropDownItem"
            onClick={handleLogout}
        >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            Log out
        </div>

    </div>
}
            <Chat></Chat>

            {loading ? (
    <div className="loadingArea">
        <ScaleLoader />
        <button
            className="stopButton"
            onClick={() => controller?.abort()}
        >
            <i className="fa-solid fa-stop"></i>
            Stop generating
        </button>
    </div>
) : null}
            
            <div className="chatInput">
                <div className="inputBox">
                    <input placeholder="Ask anything"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
    if (e.key === "Enter" && prompt.trim()) {
        getReply();
    }
}}
                    >
                           
                    </input>
                    <div id="submit" onClick={getReply}><i className="fa-solid fa-paper-plane"></i></div>
                </div>
                <p className="info">
                    GPT can make mistakes. Check important info. See Cookie Preferences.
                </p>
            </div>
        </div>
    )
}

export default ChatWindow;