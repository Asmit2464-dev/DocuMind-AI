import express from "express";
import Thread from "../models/Thread.js";
import getGeminiAPIResponse from "../utils/gemini.js";
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

// Chat with Gemini
router.post("/chat", authMiddleware, chatLimiter, async (req, res) => {
    const { threadId, message } = req.body;

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

        // Send the complete conversation to Gemini
        const assistantReply = await getGeminiAPIResponse(
            thread.messages
        );

        // Save Gemini's response
        thread.messages.push({
            role: "assistant",
            content: assistantReply
        });

        thread.updatedAt = new Date();

        await thread.save();

        res.json({
            reply: assistantReply
        });

    } catch (err) {
    console.error("Chat error:", err);

    res.status(500).json({
        error: "Failed to generate a response. Please try again."
    });
}
});

export default router;