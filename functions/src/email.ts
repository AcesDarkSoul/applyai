import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "./index";
import { FieldValue } from "firebase-admin/firestore";
import sgMail from "@sendgrid/mail";
import OpenAI from "openai";
import { openaiApiKey, sendgridApiKey, fromEmail } from "./secrets";

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

export const sendOutreachEmail = onCall(
  { maxInstances: 5, timeoutSeconds: 30, secrets: [openaiApiKey, sendgridApiKey, fromEmail] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const sendgridKey = sendgridApiKey.value();
    const openaiKey = openaiApiKey.value();
    const senderEmail = fromEmail.value() || "noreply@applyai.app";

    if (!sendgridKey || !openaiKey) {
      throw new HttpsError(
        "failed-precondition",
        "SendGrid or OpenAI API key not configured"
      );
    }

    const { recruiterEmail, recruiterName, jobTitle, company } = request.data as {
      recruiterEmail: string;
      recruiterName?: string;
      jobTitle: string;
      company: string;
    };

    if (!recruiterEmail || !jobTitle || !company) {
      throw new HttpsError(
        "invalid-argument",
        "recruiterEmail, jobTitle, and company are required"
      );
    }

    // Rate limit: max 10 emails per user per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const emailCount = await db
      .collection("outreachEmails")
      .where("userId", "==", request.auth.uid)
      .where("sentAt", ">=", today)
      .count()
      .get();

    if (emailCount.data().count >= 10) {
      throw new HttpsError(
        "resource-exhausted",
        "Daily email limit reached (10/day). Try again tomorrow."
      );
    }

    // Get user profile
    const userDoc = await db.collection("users").doc(request.auth.uid).get();
    const profile = userDoc.data();

    if (!profile) {
      throw new HttpsError("not-found", "User profile not found");
    }

    try {
      // Generate email with OpenAI
      const openai = new OpenAI({ apiKey: openaiKey });

      const context = `
Candidate: ${profile.name}
Skills: ${(profile.skills || []).join(", ")}
Experience: ${profile.experience || 0} years
Recruiter: ${recruiterName || "Hiring Manager"}
Role: ${jobTitle}
Company: ${company}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: EMAIL_PROMPT },
          { role: "user", content: context },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const emailContent = JSON.parse(
        completion.choices[0]?.message?.content || '{"subject":"","body":""}'
      );

      // Send via SendGrid
      sgMail.setApiKey(sendgridKey);

      await sgMail.send({
        to: recruiterEmail,
        from: { email: senderEmail, name: profile.name },
        replyTo: profile.email,
        subject: emailContent.subject,
        text: emailContent.body,
      });

      // Save record in Firestore
      const docRef = await db.collection("outreachEmails").add({
        userId: request.auth.uid,
        recruiterEmail,
        recruiterName: recruiterName || null,
        jobTitle,
        company,
        subject: emailContent.subject,
        body: emailContent.body,
        status: "sent",
        sentAt: FieldValue.serverTimestamp(),
      });

      return { id: docRef.id, subject: emailContent.subject, body: emailContent.body };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Email outreach error:", message);
      throw new HttpsError("internal", "Failed to send outreach email");
    }
  }
);
