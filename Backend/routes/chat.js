import express from "express";
import Thread from "../models/Thread.js";
import {
    classifyQueryIntent,
    generateFullResearchResponse,
    generateFollowupResponse,
    getOffTopicResponse,
    summarizeChatThread,
    generateRoadmapForThread
} from "../utils/gemini.js";
import { fetchResearchData } from "../utils/research.js";
import authMiddleware from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const router = express.Router();
const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: {
        error: "Too many chat requests. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});



// Get all threads
router.get("/thread", authMiddleware, async (req, res) => {
    try {
        const threads = await Thread.find({
    userId: req.userId
}).sort({ updatedAt: -1 });

        res.json(threads);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Failed to fetch threads"
        });
    }
});

// Get messages of a thread
router.get("/thread/:threadId", authMiddleware, async (req, res) => {
    const { threadId } = req.params;

    try {
        const thread = await Thread.findOne({
    threadId,
    userId: req.userId
});

        if (!thread) {
            return res.status(404).json({
                error: "Thread not found"
            });
        }

        res.json(thread.messages);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Failed to fetch chat"
        });
    }
});

// Rename a thread
router.patch("/thread/:threadId", authMiddleware, async (req, res) => {
    const { threadId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({
            error: "Title cannot be empty"
        });
    }

    if (title.trim().length > 100) {
        return res.status(400).json({
            error: "Title must be 100 characters or less"
        });
    }

    try {
        const thread = await Thread.findOneAndUpdate(
            {
                threadId,
                userId: req.userId
            },
            {
                title: title.trim(),
                updatedAt: new Date()
            },
            {
                new: true
            }
        );

        if (!thread) {
            return res.status(404).json({
                error: "Thread not found"
            });
        }

        res.json({
            message: "Thread renamed successfully",
            thread: {
                threadId: thread.threadId,
                title: thread.title
            }
        });

    } catch (err) {
        console.error("Rename thread error:", err);

        res.status(500).json({
            error: "Failed to rename thread"
        });
    }
});
// Delete a thread
router.delete("/thread/:threadId", authMiddleware, async (req, res) => {
    const { threadId } = req.params;

    try {
        const deletedThread = await Thread.findOneAndDelete({
    threadId,
    userId: req.userId
});

        if (!deletedThread) {
            return res.status(404).json({
                error: "Thread not found"
            });
        }

        res.status(200).json({
            success: "Thread deleted successfully"
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Failed to delete thread"
        });
    }
});

// Chat with Gemini & Research Engine
router.post("/chat", authMiddleware, chatLimiter, async (req, res) => {
    const { threadId, message, level = "Beginner" } = req.body;

    if (!threadId || !message) {
        return res.status(400).json({
            error: "Thread ID and message are required"
        });
    }

    const cleanMessage = message.trim();

    if (!cleanMessage) {
        return res.status(400).json({
            error: "Message cannot be empty"
        });
    }

    if (cleanMessage.length > 10000) {
        return res.status(400).json({
            error: "Message must be 10000 characters or less"
        });
    }

    try {
        let thread = await Thread.findOne({
            threadId,
            userId: req.userId
        });

        const isNewThread = !thread;

        if (!thread) {
            const existingThread = await Thread.findOne({ threadId });

            if (existingThread) {
                return res.status(403).json({
                    error: "You do not have access to this thread"
                });
            }

            thread = new Thread({
                threadId,
                userId: req.userId,
                title: cleanMessage,
                messages: [
                    {
                        role: "user",
                        content: cleanMessage
                    }
                ]
            });
        } else {
            // Add the new user message
            thread.messages.push({
                role: "user",
                content: cleanMessage
            });
        }

        // Determine conversational intent
        const prevMessages = isNewThread ? [] : thread.messages.slice(0, -1);
        const intent = classifyQueryIntent(cleanMessage, prevMessages);

        let assistantPayload = null;

        if (intent === "off_topic") {
            // Case 3: Off-topic query -> fast polite refusal, 0 search
            assistantPayload = getOffTopicResponse();
        } else if (intent === "followup") {
            // Case 1: Follow-up question -> reuses chat context, 1 Gemini call
            assistantPayload = await generateFollowupResponse(thread.messages, level);
        } else {
            // Case 2: New tech topic or resource query -> 1 Gemini + 1 Tavily + 1 YouTube
            let researchData = { webResults: [], videoResults: [] };
            try {
                researchData = await fetchResearchData(cleanMessage);
            } catch (fetchErr) {
                console.warn("Research fetch warning:", fetchErr.message);
            }

            assistantPayload = await generateFullResearchResponse(cleanMessage, researchData, level);
        }

        const replyString = JSON.stringify(assistantPayload);

        // Save assistant message with metadata
        thread.messages.push({
            role: "assistant",
            content: replyString,
            meta: assistantPayload
        });

        thread.updatedAt = new Date();
        await thread.save();

        res.json({
            reply: replyString,
            meta: assistantPayload
        });

    } catch (err) {
        console.error("Chat error:", err);

        res.status(500).json({
            error: "Failed to generate a response. Please try again."
        });
    }
});

// Fetch or generate roadmap for a thread
router.get("/thread/:threadId/roadmap", authMiddleware, async (req, res) => {
    const { threadId } = req.params;

    try {
        const thread = await Thread.findOne({
            threadId,
            userId: req.userId
        });

        if (!thread) {
            return res.status(404).json({ error: "Thread not found" });
        }

        res.json({
            roadmap: thread.roadmap || ""
        });
    } catch (err) {
        console.error("Fetch roadmap error:", err);
        res.status(500).json({ error: "Failed to fetch roadmap" });
    }
});

router.post("/thread/:threadId/roadmap", authMiddleware, async (req, res) => {
    const { threadId } = req.params;

    try {
        const thread = await Thread.findOne({
            threadId,
            userId: req.userId
        });

        if (!thread) {
            return res.status(404).json({ error: "Thread not found" });
        }

        const topic = thread.title || "Software Engineering Topic";
        const roadmap = await generateRoadmapForThread(thread.messages, topic);
        thread.roadmap = roadmap;
        thread.updatedAt = new Date();
        await thread.save();

        res.json({ roadmap });
    } catch (err) {
        console.error("Generate roadmap error:", err);
        res.status(500).json({ error: "Failed to generate roadmap" });
    }
});

// Generate or fetch summary of a thread (Short summary: key points, resources, next steps)
router.get("/thread/:threadId/summary", authMiddleware, async (req, res) => {
    const { threadId } = req.params;

    try {
        const thread = await Thread.findOne({
            threadId,
            userId: req.userId
        });

        if (!thread) {
            return res.status(404).json({ error: "Thread not found" });
        }

        res.json({
            summary: thread.summary || ""
        });
    } catch (err) {
        console.error("Fetch summary error:", err);
        res.status(500).json({ error: "Failed to fetch summary" });
    }
});

router.post("/thread/:threadId/summary", authMiddleware, async (req, res) => {
    const { threadId } = req.params;

    try {
        const thread = await Thread.findOne({
            threadId,
            userId: req.userId
        });

        if (!thread) {
            return res.status(404).json({ error: "Thread not found" });
        }

        if (!thread.messages || thread.messages.length === 0) {
            return res.json({ summary: "No messages to summarize yet." });
        }

        const summary = await summarizeChatThread(thread.messages);
        thread.summary = summary;
        thread.updatedAt = new Date();
        await thread.save();

        res.json({ summary });
    } catch (err) {
        console.error("Generate summary error:", err);
        res.status(500).json({ error: "Failed to generate summary" });
    }
});

export default router;