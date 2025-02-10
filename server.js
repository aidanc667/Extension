import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import pkg from "youtube-caption-scraper";
const { getSubtitles } = pkg;

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// ✅ Fetch transcript, retrying auto-generated captions
async function fetchTranscript(videoId) {
    try {
        console.log(`Fetching transcript for video: ${videoId}`);
        let subtitles = await getSubtitles({ videoID: videoId, lang: "en" });

        if (!subtitles.length) {
            console.warn("No English captions found. Trying auto-generated captions...");
            subtitles = await getSubtitles({ videoID: videoId, lang: "en-auto" });
        }

        if (!subtitles.length) throw new Error("No captions available.");

        return subtitles.map(entry => entry.text).join(" ");
    } catch (err) {
        console.error("Error fetching transcript:", err);
        return null; // Return null instead of a generic message
    }
}

// ✅ API Route for Gemini AI
app.post("/ask-gemini", async (req, res) => {
    try {
        const { videoId, question } = req.body;
        if (!videoId) return res.status(400).json({ error: "No YouTube video ID provided" });
        if (!question) return res.status(400).json({ error: "No question provided" });

        let transcript = await fetchTranscript(videoId);
        let promptText;

        if (transcript) {
            promptText = `Based on the following video transcript, answer the question:\n\n${transcript}\n\nQuestion: ${question}`;
        } else {
            promptText = `The transcript for this YouTube video is unavailable. Based on your general knowledge and reasoning, try to answer the following question:\n\nQuestion: ${question}`;
        }

        const requestBody = {
            contents: [{ parts: [{ text: promptText }] }]
        };

        const response = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            return res.status(response.status).json({ error: "Failed to get AI response", details: errorDetails });
        }

        const data = await response.json();
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";

        res.json({ answer });

    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Test Route
app.get("/", (req, res) => {
    res.json({ message: "Server is running!" });
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
