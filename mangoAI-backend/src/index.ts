import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

import Tesseract from "tesseract.js";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config();



const app = express();
app.use(cors());
app.use(express.json());
// AI Summarization endpoint using Gemini API
app.post("/api/summarize", async (req, res) => {
	const { transcript, instruction } = req.body;
	if (!transcript || !instruction) {
		return res.status(400).json({ error: "Transcript and instruction are required." });
	}
	try {
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			return res.status(500).json({ error: "Gemini API key not set in environment." });
		}
		const ai = new GoogleGenAI({ apiKey });
	const prompt = `You are an expert meeting assistant. Your task is to generate a clear, concise, and professional summary of the following meeting transcript.\n\n**Instructions:**\n- Always format your output in Markdown.\n- Use appropriate Markdown headings, bullet points, and bold for names or key items.\n- Clearly separate sections such as Key Decisions, Action Items (with owners and deadlines), Discussion Points, and Next Steps.\n- If the transcript is incomplete or contains errors, politely mention it.\n- Do not include any content outside the summary.\n- Follow any additional user instructions below.\n\n**User Instructions:** ${instruction}\n\n**Meeting Transcript:**\n${transcript}`;
		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: prompt
		});
		const summary = response.text || "No summary generated.";
		return res.json({ summary });
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		return res.status(500).json({ error: "Failed to generate summary", details: errorMsg });
	}
});


// Set up multer for file uploads
const upload = multer({ dest: "uploads/" });

app.post("/api/upload", upload.single("file"), async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: "No file uploaded" });
	}
	const filePath = req.file.path;
	const ext = path.extname(req.file.originalname).toLowerCase();
	let extractedText = "";
	try {
		if (ext === ".txt") {
			extractedText = fs.readFileSync(filePath, "utf-8");
		} else if (ext === ".pdf") {
			const dataBuffer = fs.readFileSync(filePath);
			const pdfData = await pdfParse(dataBuffer);
			extractedText = pdfData.text;
		} else if (ext === ".jpg" || ext === ".jpeg") {
			const { data: { text } } = await Tesseract.recognize(filePath, "eng");
			extractedText = text;
		} else {
			return res.status(400).json({ error: "Unsupported file type" });
		}
		// Clean up uploaded file
		fs.unlinkSync(filePath);
		return res.json({ text: extractedText });
	} catch (err) {
		// Clean up uploaded file on error
		if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        const errorMsg = err instanceof Error ? err.message : String(err);
		return res.status(500).json({ error: "Failed to extract text", details: errorMsg });
	}
});


app.listen(3001, () => {
	console.log("Backend server running on http://localhost:3001");
});

