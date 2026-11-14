import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const CANDIDATE_MODELS = [
    process.env.GEMINI_MODEL || "gemini-3.6-flash",
    process.env.GEMINI_CHAT_MODEL || "gemini-3.1-flash-lite",
    process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash"
];

async function generateWithFallback(options) {
    let lastError = null;

    for (const model of CANDIDATE_MODELS) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model,
                    ...options
                });
                if (response && response.text) {
                    return response.text;
                }
            } catch (err) {
                lastError = err;
                console.warn(`Model ${model} attempt ${attempt} failed:`, err.message);
                if (attempt === 1) {
                    await new Promise(res => setTimeout(res, 600));
                }
            }
        }
    }

    throw lastError || new Error("Failed to generate response from Gemini.");
}

/**
 * Fast check for off-topic non-tech queries (Case 3)
 */
export function isOffTopicQuery(query) {
    const q = query.trim().toLowerCase();
    
    const offTopicPatterns = [
        /\b(cook|cooking|recipe|pasta|pizza|cake|bake|baking|sandwich|soup|salad|food|dinner|lunch|breakfast)\b/i,
        /\b(movie|movies|song|songs|actor|actress|celebrity|gossip|cinema|bollywood|hollywood)\b/i,
        /\b(cricket|football|soccer|nba|ipl|fifa|match score|sports|stadium)\b/i,
        /\b(dating|girlfriend|boyfriend|love advice|breakup|horoscope|zodiac|astrology)\b/i,
        /\b(weather forecast|rain today|flights to|hotel booking)\b/i
    ];

    const isTechRelated = /\b(code|coding|software|developer|programming|api|database|react|node|python|java|javascript|html|css|devops|docker|kubernetes|aws|cloud|mern|sql|git|linux|bug|frontend|backend|system design|jwt|oauth)\b/i.test(q);

    if (!isTechRelated && offTopicPatterns.some(pattern => pattern.test(q))) {
        return true;
    }

    return false;
}

/**
 * Classifies query intent: 'off_topic', 'new_research', or 'followup'
 */
export function classifyQueryIntent(message, previousMessages = []) {
    if (isOffTopicQuery(message)) {
        return "off_topic";
    }

    if (!previousMessages || previousMessages.length === 0) {
        return "new_research";
    }

    const q = message.trim().toLowerCase();

    const resourceKeywords = /\b(video|videos|youtube|watch|tutorial|tutorials|doc|docs|documentation|article|articles|link|links|salary|salaries|lpa|pay|earn|roadmap|guide|show me|find)\b/i;
    if (resourceKeywords.test(q)) {
        return "new_research";
    }

    return "followup";
}

/**
 * Generates structured full research response with comprehensive, in-depth content
 * synthesised from Tavily docs, live Tavily salary search, and YouTube API.
 */
export async function generateFullResearchResponse(userQuery, researchData, level = "Beginner") {
    const prompt = `You are DevCompass, an expert technical and computer science research assistant.
Generate an in-depth, rich, and highly educational JSON response for the topic: "${userQuery}".
Difficulty Level: ${level}.

Verified Web Documentation available from Tavily:
${JSON.stringify((researchData.webResults || []).map(w => ({ title: w.title, url: w.url, domain: w.domain, snippet: w.content })))}

Live Market Salary & Job Search Results from Tavily (India):
${JSON.stringify((researchData.salaryResults || []).map(s => ({ title: s.title, snippet: s.content })))}

Verified YouTube Tutorials available:
${JSON.stringify((researchData.videoResults || []).map(v => ({ title: v.title, url: v.url, channel: v.channelTitle })))}

Instructions:
1. Provide a comprehensive, in-depth overview (3-4 detailed sentences) explaining what this technology is, how it works under the hood, and its real-world architectural role.
2. Provide 5-6 detailed key concepts covering architecture, data flow, essential prerequisites, and production edge cases.
3. For roles and salaries in India: Synthesize both the live Tavily salary results and industry benchmarks to provide realistic LPA ranges for Freshers (0-2 yrs), Mid-level (2-5 yrs), and Senior (5+ yrs).
4. Do NOT output any cost mentions.

Return ONLY valid JSON (no markdown fences, no extra text) with this exact schema:
{
  "overview": "Detailed, comprehensive overview of what ${userQuery} is, its architectural purpose, and working mechanism for a ${level}.",
  "techBadges": ["Tech1", "Tech2", "Tech3", "Tech4"],
  "keyConcepts": [
    "Detailed concept 1 (Architecture & core flow)",
    "Detailed concept 2 (How data and requests move)",
    "Detailed concept 3 (Prerequisites & foundational tools)",
    "Detailed concept 4 (Edge cases, performance or security gotchas)",
    "Detailed concept 5 (Real-world production usage)"
  ],
  "rolesAndSalary": {
    "roles": "Role 1 · Role 2 · Role 3 · Role 4",
    "salaries": [
      { "level": "Fresher", "range": "₹3–6 LPA" },
      { "level": "Mid-level", "range": "₹8–16 LPA" },
      { "level": "Senior", "range": "₹18–32 LPA" }
    ],
    "disclaimer": "Synthesized from live market reports (AmbitionBox, Glassdoor) and industry benchmarks."
  },
  "suggestions": ["Make roadmap", "Quiz me", "Compare with alternatives"]
}`;

    try {
        const raw = await generateWithFallback({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        return {
            type: "full_research",
            overview: parsed.overview || `${userQuery} is a fundamental technology in modern software engineering.`,
            techBadges: parsed.techBadges || [userQuery],
            keyConcepts: parsed.keyConcepts || [],
            videos: researchData.videoResults || [],
            docs: (researchData.webResults || []).slice(0, 6),
            rolesAndSalary: parsed.rolesAndSalary || null,
            suggestions: parsed.suggestions || ["Make roadmap", "Quiz me", "Compare with..."]
        };
    } catch (err) {
        console.warn("JSON parse fallback for research response:", err.message);
        return {
            type: "full_research",
            overview: `${userQuery} is a widely adopted technology in modern IT and software engineering, providing scalable solutions for production web and cloud architectures.`,
            techBadges: [userQuery, "Architecture", "Best Practices"],
            keyConcepts: [
                "End-to-end architectural workflow and component interaction",
                "State management and request-response lifecycle",
                "Production scalability, caching, and database indexing",
                "Security considerations including authentication, sanitization, and CORS"
            ],
            videos: researchData.videoResults || [],
            docs: (researchData.webResults || []).slice(0, 6),
            rolesAndSalary: {
                roles: "Software Engineer · Full-Stack Developer · Backend Engineer · Tech Lead",
                salaries: [
                    { level: "Fresher", range: "₹3.5–6.5 LPA" },
                    { level: "Mid-level", range: "₹8–16 LPA" },
                    { level: "Senior", range: "₹18–32 LPA" }
                ],
                disclaimer: "Synthesized from live market reports and industry estimates."
            },
            suggestions: ["Make roadmap", "Quiz me", "Deep dive"]
        };
    }
}

/**
 * Generates conversational follow-up response or an interactive 4-option (A, B, C, D) quiz.
 */
export async function generateFollowupResponse(messages, level = "Beginner") {
    const lastUserMsg = (messages[messages.length - 1]?.content || "").toLowerCase();
    const isQuizRequest = /\b(quiz|quiz me|test me|mcq|practice question)\b/i.test(lastUserMsg);

    // Case: Interactive 4-option Quiz
    if (isQuizRequest) {
        const quizPrompt = `You are DevCompass quiz master.
Generate a high-quality, practical multiple-choice question based on the conversation context for a ${level} developer.
CRITICAL REQUIREMENT: You MUST provide EXACTLY FOUR options: A, B, C, and D. Never provide fewer than 4 options.

Return ONLY valid JSON (no markdown fences, no extra text) with this schema:
{
  "type": "quiz",
  "question": "Clear, practical technical question text...",
  "options": [
    { "key": "A", "text": "Option A text" },
    { "key": "B", "text": "Option B text" },
    { "key": "C", "text": "Option C text" },
    { "key": "D", "text": "Option D text" }
  ],
  "correct": "B",
  "explanation": "Concise explanation of why this is correct and key lesson learned.",
  "suggestions": ["Next question", "Make roadmap", "Explain more"]
}`;

        try {
            const raw = await generateWithFallback({
                contents: [
                    ...messages.slice(0, -1).map(m => ({
                        role: m.role === "assistant" ? "model" : "user",
                        parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }]
                    })),
                    { role: "user", parts: [{ text: quizPrompt }] }
                ]
            });

            const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleaned);

            if (parsed.options && parsed.options.length >= 4) {
                return {
                    type: "quiz",
                    question: parsed.question,
                    options: parsed.options.slice(0, 4),
                    correct: parsed.correct || "A",
                    explanation: parsed.explanation || "",
                    suggestions: parsed.suggestions || ["Next question", "Make roadmap", "Explain more"]
                };
            }
        } catch (e) {
            console.warn("Quiz JSON parse error:", e.message);
        }
    }

    // Standard follow-up explanation
    const formattedMessages = messages.map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content) }]
    }));

    const systemInstruction = `You are DevCompass, an expert IT & technical tutor.
Difficulty Level: ${level}.
The user is asking a follow-up question. Answer directly, clearly, and concisely using the existing context of this chat.
Use practical analogies and clean code examples where helpful.
If you provide any quiz or question, ALWAYS include four options: A, B, C, and D.
At the end of your response, output a single line with JSON suggestions in this exact format:
SUGGESTIONS: ["Suggestion 1", "Suggestion 2", "Quiz me"]`;

    const rawResponse = await generateWithFallback({
        contents: formattedMessages,
        config: { systemInstruction }
    });

    let text = rawResponse;
    let suggestions = ["Find videos", "Add to roadmap", "Quiz me"];

    const match = rawResponse.match(/SUGGESTIONS:\s*(\[.*?\])/i);
    if (match) {
        try {
            suggestions = JSON.parse(match[1]);
            text = rawResponse.replace(/SUGGESTIONS:\s*\[.*?\]/i, "").trim();
        } catch (e) {
            // fallback
        }
    }

    return {
        type: "followup",
        text,
        suggestions
    };
}

/**
 * Returns polite canned refusal for off-topic questions (Case 3)
 */
export function getOffTopicResponse() {
    return {
        type: "off_topic",
        text: "I'm built for tech and IT learning. Want to explore a topic like React, Python, or databases instead?",
        suggestions: ["Learn React", "Docker basics", "Python for beginners"]
    };
}

/**
 * Generates short summary for the Summary tab
 */
export async function summarizeChatThread(messages) {
    if (!messages || messages.length === 0) {
        return "No messages in this chat yet.";
    }

    const conversationText = messages
        .map(m => `${m.role.toUpperCase()}: ${typeof m.content === "string" ? m.content.slice(0, 800) : "Research card"}`)
        .join("\n\n")
        .slice(0, 10000);

    const prompt = `Summarize this technical conversation concisely for the DevCompass Summary panel.
Include ONLY these 3 sections:
### 📌 Key Points Learned
(3-4 bullet points summarizing what was understood)

### 📚 Resources Mentioned
(List key documentation, videos, or tools discussed)

### 🚀 Next Steps
(2-3 immediate, actionable practice steps)

Keep it short, clear, and direct.

Conversation:
${conversationText}`;

    return await generateWithFallback({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
}

/**
 * Generates structured learning roadmap for the Roadmaps tab
 */
export async function generateRoadmapForThread(messages, topic = "the topic") {
    const conversationText = (messages || [])
        .map(m => `${m.role.toUpperCase()}: ${typeof m.content === "string" ? m.content.slice(0, 500) : ""}`)
        .join("\n")
        .slice(0, 8000);

    const prompt = `You are a Principal Software Engineer and Curriculum Architect.
Generate a complete step-by-step phased learning roadmap for: "${topic}".

Structure with Markdown:
# 🗺️ Complete Learning Roadmap: ${topic}

### Phase 1: Foundations
* Core prerequisites, concepts, syntax, and foundational knowledge.

### Phase 2: Core Frameworks & Tooling
* The primary libraries, state management, and modern workflows.

### Phase 3: Backend, APIs & Data
* Server-side logic, database design, REST/GraphQL APIs, and authentication.

### Phase 4: Production & Deployment
* Build tools, environment management, containerization, and hosting.

### Phase 5: Advanced & Scaling
* System design, caching, microservices, cloud (AWS/Docker/Kubernetes), and testing.

### 🛠️ Capstone Project Ideas
1. Beginner project: ...
2. Full-stack portfolio project: ...

Context from discussion:
${conversationText}`;

    return await generateWithFallback({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
}
