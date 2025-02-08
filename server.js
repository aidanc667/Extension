require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");


const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Load API key from .env

app.post("/ask-gemini", async (req, res) => {
    try {
        const { transcript, question } = req.body;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: `Based on this transcript, answer the following question:\n\n${transcript}\n\nQuestion: ${question}`
            })
        });

        const data = await response.json();
        res.json({ answer: data.candidates?.[0]?.output || "No response from AI." });

    } catch (error) {
        res.status(500).json({ error: "Error contacting Gemini AI" });
    }
});

app.get("/", (req, res) => {
    res.json({ message: "Welcome to the YouTube Gemini Backend API!" });
});

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
});

const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        contents: [
            { parts: [{ text: `Based on this transcript, answer the following question:\n\n${transcript}\n\nQuestion: ${question}` }] }
        ]
    })
});

const data = await response.json();
console.log("Gemini API Full Response:", JSON.stringify(data, null, 2)); // Log full response for debugging

// Extract the answer properly
const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";
res.json({ answer, raw: data });


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


