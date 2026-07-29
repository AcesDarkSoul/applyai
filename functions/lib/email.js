"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOutreachEmail = void 0;
const https_1 = require("firebase-functions/v2/https");
const index_1 = require("./index");
const firestore_1 = require("firebase-admin/firestore");
const mail_1 = __importDefault(require("@sendgrid/mail"));
const openai_1 = __importDefault(require("openai"));
const secrets_1 = require("./secrets");
const EMAIL_PROMPT = `You are a professional career networking assistant. Write a brief, personalized outreach email to a recruiter.

Rules:
- Keep it under 150 words
- Professional, respectful, not pushy
- Mention the specific role and company
- Briefly highlight 2-3 relevant skills from the candidate's profile
- Include a clear call-to-action (e.g., requesting a brief call or sharing their resume)
- Do NOT use overly casual language or excessive flattery

Return a JSON object:
{
  "subject": "email subject line",
  "body": "email body text"
}`;
exports.sendOutreachEmail = (0, https_1.onCall)({ maxInstances: 5, timeoutSeconds: 30, secrets: [secrets_1.openaiApiKey, secrets_1.sendgridApiKey, secrets_1.fromEmail] }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be logged in");
    }
    const sendgridKey = secrets_1.sendgridApiKey.value();
    const openaiKey = secrets_1.openaiApiKey.value();
    const senderEmail = secrets_1.fromEmail.value() || "noreply@applyai.app";
    if (!sendgridKey || !openaiKey) {
        throw new https_1.HttpsError("failed-precondition", "SendGrid or OpenAI API key not configured");
    }
    const { recruiterEmail, recruiterName, jobTitle, company } = request.data;
    if (!recruiterEmail || !jobTitle || !company) {
        throw new https_1.HttpsError("invalid-argument", "recruiterEmail, jobTitle, and company are required");
    }
    // Rate limit: max 10 emails per user per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const emailCount = await index_1.db
        .collection("outreachEmails")
        .where("userId", "==", request.auth.uid)
        .where("sentAt", ">=", today)
        .count()
        .get();
    if (emailCount.data().count >= 10) {
        throw new https_1.HttpsError("resource-exhausted", "Daily email limit reached (10/day). Try again tomorrow.");
    }
    // Get user profile
    const userDoc = await index_1.db.collection("users").doc(request.auth.uid).get();
    const profile = userDoc.data();
    if (!profile) {
        throw new https_1.HttpsError("not-found", "User profile not found");
    }
    try {
        // Generate email with OpenAI
        const openai = new openai_1.default({ apiKey: openaiKey });
        const context = `
Candidate: ${profile.name}
Skills: ${(profile.skills || []).join(", ")}
Experience: ${profile.experience || 0} years
Recruiter: ${recruiterName || "Hiring Manager"}
Role: ${jobTitle}
Company: ${company}`;
        let completion;
        try {
            completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: EMAIL_PROMPT },
                    { role: "user", content: context },
                ],
                temperature: 0.7,
                max_tokens: 500,
                response_format: { type: "json_object" },
            });
        }
        catch (err) {
            console.warn("gpt-4o failed in sendOutreachEmail, falling back to gpt-4o-mini:", err);
            completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: EMAIL_PROMPT },
                    { role: "user", content: context },
                ],
                temperature: 0.7,
                max_tokens: 500,
                response_format: { type: "json_object" },
            });
        }
        const emailContent = JSON.parse(completion.choices[0]?.message?.content || '{"subject":"","body":""}');
        // Send via SendGrid
        mail_1.default.setApiKey(sendgridKey);
        await mail_1.default.send({
            to: recruiterEmail,
            from: { email: senderEmail, name: profile.name },
            replyTo: profile.email,
            subject: emailContent.subject,
            text: emailContent.body,
        });
        // Save record in Firestore
        const docRef = await index_1.db.collection("outreachEmails").add({
            userId: request.auth.uid,
            recruiterEmail,
            recruiterName: recruiterName || null,
            jobTitle,
            company,
            subject: emailContent.subject,
            body: emailContent.body,
            status: "sent",
            sentAt: firestore_1.FieldValue.serverTimestamp(),
        });
        return { id: docRef.id, subject: emailContent.subject, body: emailContent.body };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Email outreach error:", message);
        throw new https_1.HttpsError("internal", "Failed to send outreach email");
    }
});
//# sourceMappingURL=email.js.map