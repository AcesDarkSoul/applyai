"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCoverLetter = void 0;
const https_1 = require("firebase-functions/v2/https");
const index_1 = require("./index");
const firestore_1 = require("firebase-admin/firestore");
const openai_1 = __importDefault(require("openai"));
const secrets_1 = require("./secrets");
const userDoc_1 = require("./userDoc");
const COVER_LETTER_PROMPT = `You are an expert career consultant. Write a professional, personalized cover letter.

Rules:
- Use the candidate's actual skills and experience from their profile
- Reference specific requirements from the job description
- Keep it to 3-4 paragraphs, under 350 words
- Professional but warm tone
- Do NOT fabricate experience the candidate doesn't have
- Include a strong opening, body highlighting relevant skills, and a compelling closing

Return ONLY the cover letter text, no extra formatting or headers.`;
exports.generateCoverLetter = (0, https_1.onCall)({ maxInstances: 10, timeoutSeconds: 60, secrets: [secrets_1.openaiApiKey] }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be logged in");
    }
    const openaiKey = secrets_1.openaiApiKey.value();
    if (!openaiKey) {
        throw new https_1.HttpsError("failed-precondition", "OpenAI API key not configured");
    }
    const { jobTitle, company, jobDescription } = request.data;
    if (!jobTitle || !company) {
        throw new https_1.HttpsError("invalid-argument", "jobTitle and company are required");
    }
    // Get user profile (email-keyed)
    const userProfile = await (0, userDoc_1.getUserProfileDoc)(request.auth);
    const profile = userProfile?.data;
    if (!profile) {
        throw new https_1.HttpsError("not-found", "User profile not found");
    }
    const userContext = `
Candidate Profile:
- Name: ${profile.name}
- Skills: ${(profile.skills || []).join(", ")}
- Experience: ${profile.experience || 0} years
- Education: ${(profile.education || []).map((e) => `${e.degree} in ${e.field} from ${e.institution}`).join("; ") || "Not specified"}
- Summary: ${profile.summary || "Not provided"}

Job Details:
- Title: ${jobTitle}
- Company: ${company}
- Description: ${(jobDescription || "").substring(0, 2000)}`;
    try {
        const openai = new openai_1.default({ apiKey: openaiKey });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: COVER_LETTER_PROMPT },
                { role: "user", content: userContext },
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });
        const coverLetter = completion.choices[0]?.message?.content || "";
        // Save to Firestore
        const docRef = await index_1.db.collection("coverLetters").add({
            userId: request.auth.uid,
            jobTitle,
            company,
            content: coverLetter,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
        return { id: docRef.id, content: coverLetter };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Cover letter error:", message);
        throw new https_1.HttpsError("internal", "Failed to generate cover letter");
    }
});
//# sourceMappingURL=coverLetter.js.map