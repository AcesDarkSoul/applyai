"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResume = void 0;
const https_1 = require("firebase-functions/v2/https");
const index_1 = require("./index");
const firestore_1 = require("firebase-admin/firestore");
const openai_1 = __importDefault(require("openai"));
const secrets_1 = require("./secrets");
const RESUME_PARSE_PROMPT = `You are a professional resume parser. Extract ALL personal and professional information from the resume text.
Return ONLY valid JSON with this exact structure:
{
  "name": "full name from resume",
  "email": "email or null",
  "phone": "phone number with country code if present, or null",
  "location": "city/state/country from resume address section",
  "preferredLocation": "same as location or remote preference if stated",
  "expectedSalary": "salary expectation if mentioned, else null",
  "workAuthorization": "work visa/authorization if mentioned, else null",
  "linkedin": "LinkedIn URL if present, else null",
  "skills": ["technical and soft skills"],
  "experience": number (total years of professional experience),
  "education": [{"institution": "string", "degree": "string", "field": "string", "startYear": number, "endYear": number|null}],
  "certifications": ["certification names"],
  "projects": [{"name": "string", "description": "string", "technologies": ["strings"]}],
  "languages": ["spoken/written languages"],
  "summary": "2-4 sentence professional summary from resume",
  "atsScore": number (0-100, ATS compatibility estimate)
}
Extract real values only — do not invent data. Use null or empty arrays for missing fields.`;
async function extractTextFromBase64(base64, fileName) {
    const buffer = Buffer.from(base64, "base64");
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".pdf")) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const pdfParse = require("pdf-parse");
            const data = await pdfParse(buffer);
            if (data.text?.trim().length > 50)
                return data.text.substring(0, 12000);
        }
        catch {
            // fall through
        }
    }
    const utf8 = buffer.toString("utf-8");
    if (utf8.length > 100 && !utf8.includes("\u0000")) {
        return utf8.substring(0, 12000);
    }
    return `Resume file: ${fileName}. Text extraction limited — infer reasonable skills for a software/tech professional from filename and any partial text: ${utf8.substring(0, 500)}`;
}
exports.parseResume = (0, https_1.onCall)({ maxInstances: 10, timeoutSeconds: 90, secrets: [secrets_1.openaiApiKey] }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be logged in");
    }
    const userId = request.auth.uid;
    const { resumeBase64, fileName, resumeUrl } = request.data;
    const openaiKey = secrets_1.openaiApiKey.value();
    if (!openaiKey) {
        throw new https_1.HttpsError("failed-precondition", "OpenAI API key not configured");
    }
    let textContent = "";
    if (resumeBase64 && fileName) {
        if (resumeBase64.length > 14_000_000) {
            throw new https_1.HttpsError("invalid-argument", "Resume file too large (max ~10MB)");
        }
        textContent = await extractTextFromBase64(resumeBase64, fileName);
    }
    else if (resumeUrl) {
        throw new https_1.HttpsError("invalid-argument", "Cloud storage resumes are deprecated. Send resumeBase64 from local device.");
    }
    else {
        throw new https_1.HttpsError("invalid-argument", "resumeBase64 and fileName are required");
    }
    try {
        const openai = new openai_1.default({ apiKey: openaiKey });
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: RESUME_PARSE_PROMPT },
                { role: "user", content: textContent },
            ],
            temperature: 0.1,
            max_tokens: 2000,
            response_format: { type: "json_object" },
        });
        const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
        const profileUpdate = {
            skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 50) : [],
            experience: typeof parsed.experience === "number" ? parsed.experience : 0,
            education: Array.isArray(parsed.education) ? parsed.education.slice(0, 10) : [],
            certifications: Array.isArray(parsed.certifications) ? parsed.certifications.slice(0, 20) : [],
            projects: Array.isArray(parsed.projects) ? parsed.projects.slice(0, 10) : [],
            languages: Array.isArray(parsed.languages) ? parsed.languages.slice(0, 10) : [],
            summary: typeof parsed.summary === "string" ? parsed.summary.substring(0, 500) : "",
            atsScore: typeof parsed.atsScore === "number" ? Math.min(100, Math.max(0, parsed.atsScore)) : 50,
            hasResume: true,
            resumeFileName: fileName || "resume.pdf",
            parseStatus: "complete",
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        if (typeof parsed.name === "string" && parsed.name.trim()) {
            profileUpdate.name = parsed.name.trim().substring(0, 100);
        }
        if (typeof parsed.phone === "string" && parsed.phone.trim()) {
            profileUpdate.phone = parsed.phone.trim().substring(0, 30);
        }
        if (typeof parsed.location === "string" && parsed.location.trim()) {
            profileUpdate.preferredLocation = parsed.location.trim().substring(0, 100);
        }
        else if (typeof parsed.preferredLocation === "string" && parsed.preferredLocation.trim()) {
            profileUpdate.preferredLocation = parsed.preferredLocation.trim().substring(0, 100);
        }
        if (typeof parsed.expectedSalary === "string" && parsed.expectedSalary.trim()) {
            profileUpdate.expectedSalary = parsed.expectedSalary.trim().substring(0, 50);
        }
        if (typeof parsed.workAuthorization === "string" && parsed.workAuthorization.trim()) {
            profileUpdate.workAuthorization = parsed.workAuthorization.trim().substring(0, 100);
        }
        if (typeof parsed.linkedin === "string" && parsed.linkedin.trim()) {
            profileUpdate.linkedin = parsed.linkedin.trim().substring(0, 200);
        }
        await index_1.db.collection("users").doc(userId).set(profileUpdate, { merge: true });
        return { success: true, profile: profileUpdate, parsedRaw: parsed };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Resume parse error:", message);
        throw new https_1.HttpsError("internal", "Failed to parse resume: " + message);
    }
});
//# sourceMappingURL=resume.js.map