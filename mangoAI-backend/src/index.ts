import { marked } from "marked";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import  { Resend } from 'resend';
import Tesseract from "tesseract.js";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { exit } from "process";
dotenv.config();

const PORT = Number(process.env.PORT) || 3001;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// new gemini client 
if(!GEMINI_API_KEY) {
    console.error("Gemini API key not set in environment.");
    exit(1);
}
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// resend instance 
if (!RESEND_API_KEY) {
    console.error("Resend API key not set in environment.");
    exit(1);
}

const resend = new Resend(RESEND_API_KEY);
const my_email = process.env.MY_EMAIL;
if(!my_email) {
    console.error("My email not set in environment.");
    exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health",(req,res)=>{
	return res.json({ status: "ok" });
})

// AI Summarization endpoint using Gemini API
app.post("/api/summarize", async (req, res) => {
	const { transcript, instruction } = req.body;
	if (!transcript || !instruction) {
		return res.status(400).json({ error: "Transcript and instruction are required." });
	}
	try {
		if (!GEMINI_API_KEY) {
			return res.status(500).json({ error: "Gemini API key not set in environment." });
		}
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


// Set up multer for file uploads with 10 MB file size limit
const upload = multer({
	dest: "uploads/",
	limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

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


app.post("/api/send-email", async (req, res) => {
	const { subject, recipients, html, summary } = req.body;
	const MAX_RECIPIENTS = 10;
	if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
		return res.status(400).json({ error: "At least one recipient is required." });
	}
	if (recipients.length > MAX_RECIPIENTS) {
		return res.status(400).json({ error: `You can send to a maximum of ${MAX_RECIPIENTS} recipients at once.` });
	}
	const emailSubject = subject || "Your AI Meeting Summary";
	// Prefer html, fallback to summary (Markdown)
	let emailHtml = html;
	if (!emailHtml && summary) {
		// Convert Markdown summary to HTML for beautiful email formatting
		emailHtml = marked.parse(summary);
	}
	// Elegant, branded wrapper with timestamp
	const sentAt = new Date().toLocaleString();
		const htmlContent = `
			<div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; padding: 32px;">
				<div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px #0001; padding: 32px;">
					<h2 style="color: #3b82f6; margin-bottom: 0.5em;">AI Meeting Summary</h2>
					<p style="color: #64748b; margin-top: 0;">Generated by MangoDesk</p>
					<hr style="margin: 1.5em 0; border: none; border-top: 1px solid #e5e7eb;" />
					${emailHtml || '<p>No summary provided.</p>'}
					<hr style="margin: 1.5em 0; border: none; border-top: 1px solid #e5e7eb;" />
					<p style="font-size: 0.95em; color: #94a3b8;">This summary was generated and shared securely using MangoDesk AI Meeting Summarizer.<br/><span style="font-size:0.95em;">Sent at: <strong>${sentAt}</strong></span></p>
				</div>
			</div>
		`;
	try {
		const result = await resend.emails.send({
			from: my_email,
			to: recipients,
			subject: emailSubject,
			html: htmlContent,
		});
        if(result.data?.id) {
			return res.json({ success: true, result });
		} else {
			return res.status(500).json({ error: "Failed to send email", details: "No email ID returned" });
		}

	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		return res.status(500).json({ error: "Failed to send email", details: errorMsg });
	}
});

app.listen(PORT, "0.0.0.0", () => {
	console.log(`Backend server running on http://localhost:${PORT}`);
});


