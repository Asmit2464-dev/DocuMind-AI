import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const getGeminiAPIResponse = async (messages) => {
    const contents = messages.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [
            {
                text: msg.content
            }
        ]
    }));

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents
            });

            return response.text;

        } catch (err) {
            console.error(
                `Gemini API attempt ${attempt} failed:`,
                err.message
            );

            if (err.status === 503 && attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }

            throw err;
        }
    }
};

export default getGeminiAPIResponse;