import "./Chat.css";
import React, { useContext, useState, useEffect } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat() {
    const { newChat, prevChats, reply } = useContext(MyContext);

    const [latestReply, setLatestReply] = useState(null);
    const [copied, setCopied] = useState(false);

    const copyCode = async (code) => {
        try {
            await navigator.clipboard.writeText(code);

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 1500);
        } catch (err) {
            console.log("Failed to copy code:", err);
        }
    };

    useEffect(() => {
    if (reply === null) {
        setLatestReply(null);
        return;
    }

    const content = reply.split(/(\s+)/);

    let idx = 0;

    const interval = setInterval(() => {
        setLatestReply(
            content.slice(0, idx + 1).join("")
        );

        idx++;

        if (idx >= content.length) {
            clearInterval(interval);
        }
    }, 25);

    return () => clearInterval(interval);
}, [reply]);

    const markdownComponents = {
        code({ inline, className, children, ...props }) {
            const code = String(children).replace(/\n$/, "");

            if (inline) {
                return (
                    <code className={className} {...props}>
                        {children}
                    </code>
                );
            }

            return (
                <div className="codeBlock">
                    <div className="codeHeader">
                        <span>
                            {className
    ?.replace("language-", "")
    .replace("hljs", "")
    .trim() || "code"}
                        </span>

                       <button
    type="button"
    onClick={() => copyCode(code)}
    title={copied ? "Copied" : "Copy code"}
>
    <i className={copied ? "fa-solid fa-check" : "fa-regular fa-copy"}></i>
    {copied ? "Copied!" : "Copy"}
</button>
                    </div>

                    <pre>
                        <code
                            className={className}
                            {...props}
                        >
                            {children}
                        </code>
                    </pre>
                </div>
            );
        }
    };

    return (
        <>
            {newChat && <h1>Start a New Chat!</h1>}

            <div className="chats">

                {/* Previous messages */}
                {prevChats?.slice(0, -1).map((chat, idx) => (
                    <div
                        className={
                            chat.role === "user"
                                ? "userDiv"
                                : "gptDiv"
                        }
                        key={idx}
                    >
                        {chat.role === "user" ? (
                            <p className="userMessage">
                                {chat.content}
                            </p>
                        ) : (
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight]}
                                components={markdownComponents}
                            >
                                {chat.content}
                            </ReactMarkdown>
                        )}
                    </div>
                ))}

                {/* Latest assistant response */}
                {prevChats?.length > 0 && (
                    <>
                        {latestReply === null ? (
                            <div
                                className="gptDiv"
                                key="non-typing"
                            >
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight]}
                                    components={markdownComponents}
                                >
                                    {
                                        prevChats[
                                            prevChats.length - 1
                                        ].content
                                    }
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <div
                                className="gptDiv"
                                key="typing"
                            >
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight]}
                                    components={markdownComponents}
                                >
                                    {latestReply}
                                </ReactMarkdown>
                            </div>
                        )}
                    </>
                )}

            </div>
        </>
    );
}

export default Chat;