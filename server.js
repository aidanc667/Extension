import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

app.post("/ask-gemini", async (req, res) => {
    try {
        const { transcript, question } = req.body;

        if (!question) {
            return res.status(400).json({ error: "No question provided" });
        }

        // ✅ Correct Gemini AI request format
        const requestBody = {
            contents: [{ parts: [{ text: `Based on this transcript: ${transcript}, answer: ${question}` }] }]
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
        console.error("Error contacting Gemini AI:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Test Route to check if server is running
app.get("/", (req, res) => {
    res.json({ message: "Server is running!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
