import "./Chat.css";
import React, { useContext, useState, useRef, useEffect } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat({ loading, onStopGenerating, onSendSuggestion }) {
    const { newChat, prevChats, setPrompt, handleMakeRoadmap } = useContext(MyContext);
    const [playingVideoId, setPlayingVideoId] = useState(null);
    const [selectedQuizAnswers, setSelectedQuizAnswers] = useState({});
    const messagesEndRef = useRef(null);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [prevChats, loading]);

    const handleCategoryClick = (category) => {
        const topics = {
            "Web Dev": "Learn Full-Stack Web Development roadmap and core concepts",
            "DevOps": "Docker and Kubernetes DevOps workflow for beginners",
            "AI/ML": "Machine Learning and LLM engineering fundamentals",
            "DSA": "Data Structures and Algorithms roadmap with LeetCode guide",
            "Career": "Tech career roadmap, software engineer roles and salary growth"
        };
        const msg = topics[category] || `Learn ${category}`;
        if (onSendSuggestion) {
            onSendSuggestion(msg);
        } else {
            setPrompt(msg);
        }
    };

    const handleCardSuggestion = (text) => {
        if (text === "Make roadmap" || text === "Add to roadmap") {
            if (handleMakeRoadmap) {
                handleMakeRoadmap();
            }
            return;
        }

        if (onSendSuggestion) {
            onSendSuggestion(text);
        } else {
            setPrompt(text);
        }
    };

    const handleSelectQuizOption = (messageIdx, optionKey) => {
        setSelectedQuizAnswers(prev => ({
            ...prev,
            [messageIdx]: optionKey
        }));
    };

    // Render assistant message (structured cards, interactive quiz, or fallback markdown)
    const renderAssistantMessage = (content, messageIdx) => {
        let payload = null;
        if (typeof content === "object" && content !== null) {
            payload = content;
        } else if (typeof content === "string") {
            try {
                payload = JSON.parse(content);
            } catch (e) {
                payload = null;
            }
        }

        // Case: Interactive 4-Option Quiz (A, B, C, D)
        if (payload && payload.type === "quiz") {
            const chosen = selectedQuizAnswers[messageIdx];
            return (
                <div className="quizContainer">
                    <div className="sectionCard quizCard">
                        <div className="cardHeader">
                            <i className="fa-solid fa-graduation-cap"></i> TECHNICAL KNOWLEDGE CHECK
                        </div>
                        <div className="quizQuestionText">{payload.question}</div>

                        <div className="quizOptionsGrid">
                            {payload.options?.map((opt) => {
                                const isSelected = chosen === opt.key;
                                const isCorrect = opt.key === payload.correct;
                                let btnClass = "quizOptionBtn";
                                if (chosen) {
                                    if (isSelected && isCorrect) btnClass += " quizOptCorrect";
                                    else if (isSelected && !isCorrect) btnClass += " quizOptIncorrect";
                                    else if (isCorrect) btnClass += " quizOptCorrect";
                                }
                                return (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        className={btnClass}
                                        onClick={() => handleSelectQuizOption(messageIdx, opt.key)}
                                        disabled={!!chosen}
                                    >
                                        <span className="optKeyBadge">{opt.key}</span>
                                        <span className="optText">{opt.text}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {chosen && (
                            <div className="quizFeedbackBox">
                                <div className={chosen === payload.correct ? "feedbackCorrect" : "feedbackIncorrect"}>
                                    {chosen === payload.correct ? (
                                        <span><i className="fa-solid fa-circle-check"></i> Correct! Great job.</span>
                                    ) : (
                                        <span><i className="fa-solid fa-circle-xmark"></i> Incorrect. Correct option is {payload.correct}.</span>
                                    )}
                                </div>
                                {payload.explanation && (
                                    <p className="quizExplanation">{payload.explanation}</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="researchBottomBar">
                        <div className="actionButtonsRow">
                            {payload.suggestions?.map((sug, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className="actionBtn"
                                    onClick={() => handleCardSuggestion(sug)}
                                >
                                    {sug}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        // Case 2: Full Research DevCompass layout (Notice & Cost completely removed)
        if (payload && payload.type === "full_research") {
            return (
                <div className="researchCardsContainer">
                    {/* Overview Card */}
                    <div className="sectionCard">
                        <div className="cardHeader">OVERVIEW</div>
                        <p className="overviewText">{payload.overview}</p>
                        {payload.techBadges && payload.techBadges.length > 0 && (
                            <div className="techBadgeList">
                                {payload.techBadges.map((badge, idx) => (
                                    <span key={idx} className="techBadge">{badge}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Key Concepts Card */}
                    {payload.keyConcepts && payload.keyConcepts.length > 0 && (
                        <div className="sectionCard">
                            <div className="cardHeader">KEY CONCEPTS</div>
                            <ul className="conceptsList">
                                {payload.keyConcepts.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Videos Card (No autoplay on load) */}
                    {payload.videos && payload.videos.length > 0 && (
                        <div className="sectionCard">
                            <div className="cardHeader">VIDEOS</div>
                            <div className="videoGrid">
                                {payload.videos.slice(0, 3).map((video, idx) => (
                                    <div key={idx} className="videoItemCard">
                                        <div
                                            className="videoThumbnailArea"
                                            style={{
                                                backgroundImage: video.thumbnail ? `url(${video.thumbnail})` : "none"
                                            }}
                                        >
                                            {playingVideoId === (video.videoId || video.id) ? (
                                                <div className="videoPlayerWrapper">
                                                    <iframe
                                                        className="inlineVideoFrame"
                                                        src={`https://www.youtube.com/embed/${video.videoId || video.id}`}
                                                        title={video.title}
                                                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    ></iframe>
                                                    <button
                                                        type="button"
                                                        className="closeVideoBtn"
                                                        onClick={() => setPlayingVideoId(null)}
                                                        title="Close video"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <div
                                                    className="playOverlayTrigger"
                                                    onClick={() => setPlayingVideoId(video.videoId || video.id)}
                                                    title="Click to play video"
                                                >
                                                    <div className="playButtonCircle">
                                                        <i className="fa-solid fa-play"></i>
                                                    </div>
                                                    <span className="durationBadge">Click to play</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="videoDetails">
                                            <div className="videoTitle" title={video.title}>
                                                [{idx + 1}] {video.title}
                                            </div>
                                            <div className="videoChannelLine">
                                                <span>{video.channelTitle || "YouTube"}</span>
                                                <a
                                                    href={video.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="videoExternalLink"
                                                >
                                                    Watch on YouTube <i className="fa-solid fa-arrow-up-right-from-square"></i>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Docs and Articles Card */}
                    {payload.docs && payload.docs.length > 0 && (
                        <div className="sectionCard">
                            <div className="cardHeader">DOCS AND ARTICLES</div>
                            <div className="docsList">
                                {payload.docs.slice(0, 6).map((doc, idx) => (
                                    <a
                                        key={idx}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="docItemRow"
                                    >
                                        <div className="docLeft">
                                            <div className="docTitle">[{idx + 4}] {doc.title}</div>
                                            <div className="docDomain">{doc.domain || "documentation"}</div>
                                        </div>
                                        <i className="fa-solid fa-arrow-up-right-from-square docArrow"></i>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Roles and Salary Card */}
                    {payload.rolesAndSalary && (
                        <div className="sectionCard">
                            <div className="cardHeader">ROLES AND SALARY (INDIA)</div>
                            <div className="rolesSubtitle">
                                {payload.rolesAndSalary.roles}
                            </div>
                            <div className="salaryCardsRow">
                                {payload.rolesAndSalary.salaries?.map((sal, idx) => (
                                    <div key={idx} className="salaryBox">
                                        <div className="salaryValue">{sal.range}</div>
                                        <div className="salaryLevel">{sal.level}</div>
                                    </div>
                                ))}
                            </div>
                            <p className="salaryDisclaimer">
                                {payload.rolesAndSalary.disclaimer}
                            </p>
                        </div>
                    )}

                    {/* Bottom Suggestions (No Cost label) */}
                    <div className="researchBottomBar">
                        <div className="actionButtonsRow">
                            {payload.suggestions?.map((sug, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`actionBtn ${sug.includes("roadmap") ? "actionBtnPrimary" : ""}`}
                                    onClick={() => handleCardSuggestion(sug)}
                                >
                                    {sug}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        // Case 1: Followup question response
        if (payload && payload.type === "followup") {
            return (
                <div className="followupContainer">
                    <div className="sectionCard followupCard">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                            {payload.text}
                        </ReactMarkdown>
                    </div>

                    <div className="researchBottomBar">
                        <div className="actionButtonsRow">
                            {payload.suggestions?.map((sug, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className="actionBtn"
                                    onClick={() => handleCardSuggestion(sug)}
                                >
                                    {sug}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        // Case 3: Off-topic response
        if (payload && payload.type === "off_topic") {
            return (
                <div className="offTopicContainer">
                    <div className="sectionCard offTopicCard">
                        <i className="fa-solid fa-compass offTopicIcon"></i>
                        <p className="offTopicText">{payload.text}</p>
                    </div>
                    <div className="researchBottomBar">
                        <div className="actionButtonsRow">
                            {payload.suggestions?.map((sug, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className="actionBtn"
                                    onClick={() => handleCardSuggestion(sug)}
                                >
                                    {sug}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        // Fallback: Markdown
        return (
            <div className="gptDiv">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {content}
                </ReactMarkdown>
            </div>
        );
    };

    return (
        <>
            {newChat && (
                <div className="researchHero">
                    <div className="heroBadge">
                        Tech & IT Learning Hub
                    </div>
                    <h1 className="heroTitle">
                        Dev<span className="heroTitleHighlight">Compass</span>
                    </h1>
                    <p className="heroSubtitle">
                        Learn any tech topic: explanations, videos, docs and a roadmap in one place.
                    </p>

                    {/* Category Filter Pills */}
                    <div className="categoryPillsRow">
                        {["Web Dev", "DevOps", "AI/ML", "DSA", "Career"].map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                className="categoryPill"
                                onClick={() => handleCategoryClick(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* 4 Cards Grid */}
                    <div className="heroSuggestions">
                        <div
                            className="suggestionCard"
                            onClick={() => handleCardSuggestion("Learn the MERN stack: roadmap, videos and docs for beginners")}
                        >
                            <div className="suggestionIcon greenIcon">
                                <i className="fa-solid fa-puzzle-piece"></i>
                            </div>
                            <div className="suggestionText">
                                <span className="suggestionTitle">Learn the MERN stack</span>
                                <span className="suggestionDesc">Roadmap, videos and docs for beginners</span>
                            </div>
                        </div>

                        <div
                            className="suggestionCard"
                            onClick={() => handleCardSuggestion("Docker for beginners: core concepts, commands and a first project")}
                        >
                            <div className="suggestionIcon cyanIcon">
                                <i className="fa-solid fa-box-archive"></i>
                            </div>
                            <div className="suggestionText">
                                <span className="suggestionTitle">Docker for beginners</span>
                                <span className="suggestionDesc">Core concepts, commands and a first project</span>
                            </div>
                        </div>

                        <div
                            className="suggestionCard"
                            onClick={() => handleCardSuggestion("System design basics: scaling, caching and load balancing")}
                        >
                            <div className="suggestionIcon redIcon">
                                <i className="fa-solid fa-server"></i>
                            </div>
                            <div className="suggestionText">
                                <span className="suggestionTitle">System design basics</span>
                                <span className="suggestionDesc">Scaling, caching and load balancing</span>
                            </div>
                        </div>

                        <div
                            className="suggestionCard"
                            onClick={() => handleCardSuggestion("OAuth 2.0 vs JWT: when to use which, with examples")}
                        >
                            <div className="suggestionIcon yellowIcon">
                                <i className="fa-solid fa-lock"></i>
                            </div>
                            <div className="suggestionText">
                                <span className="suggestionTitle">OAuth 2.0 vs JWT</span>
                                <span className="suggestionDesc">When to use which, with examples</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="chats">
                {prevChats?.map((chat, idx) => (
                    <div
                        className={chat.role === "user" ? "userDiv" : "assistantDiv"}
                        key={idx}
                    >
                        {chat.role === "user" ? (
                            <div className="userMessage">
                                {chat.content}
                            </div>
                        ) : (
                            renderAssistantMessage(chat.content, idx)
                        )}
                    </div>
                ))}

                {/* Inline loading indicator right below the user prompt */}
                {loading && (
                    <div className="assistantLoadingRow">
                        <div className="typingIndicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        {onStopGenerating && (
                            <button
                                type="button"
                                className="stopButtonInline"
                                onClick={onStopGenerating}
                            >
                                <i className="fa-solid fa-stop"></i> Stop
                            </button>
                        )}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>
        </>
    );
}

export default Chat;
