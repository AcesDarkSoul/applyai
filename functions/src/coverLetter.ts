import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "./index";
import { FieldValue } from "firebase-admin/firestore";
import OpenAI from "openai";
import { openaiApiKey } from "./secrets";

const COVER_LETTER_PROMPT = `You are an expert career consultant. Write a professional, personalized cover letter.

Rules:
- Use the candidate's actual skills and experience from their profile
- Reference specific requirements from the job description
- Keep it to 3-4 paragraphs, under 350 words
- Professional but warm tone
- Do NOT fabricate experience the candidate doesn't have
- Include a strong opening, body highlighting relevant skills, and a compelling closing

Return ONLY the cover letter text, no extra formatting or headers.`;

export const generateCoverLetter = onCall(
  { maxInstances: 10, timeoutSeconds: 60, secrets: [openaiApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const openaiKey = openaiApiKey.value();
    if (!openaiKey) {
      throw new HttpsError("failed-precondition", "OpenAI API key not configured");
    }

    const { jobTitle, company, jobDescription } = request.data as {
      jobTitle: string;
      company: string;
      jobDescription: string;
    };

    if (!jobTitle || !company) {
      throw new HttpsError("invalid-argument", "jobTitle and company are required");
    }

    // Get user profile
    const userDoc = await db.collection("users").doc(request.auth.uid).get();
    const profile = userDoc.data();

    if (!profile) {
      throw new HttpsError("not-found", "User profile not found");
    }

    const userContext = `
Candidate Profile:
- Name: ${profile.name}
- Skills: ${(profile.skills || []).join(", ")}
- Experience: ${profile.experience || 0} years
- Education: ${(profile.education || []).map((e: { degree: string; field: string; institution: string }) => `${e.degree} in ${e.field} from ${e.institution}`).join("; ") || "Not specified"}
- Summary: ${profile.summary || "Not provided"}

Job Details:
- Title: ${jobTitle}
- Company: ${company}
- Description: ${(jobDescription || "").substring(0, 2000)}`;

    try {
      const openai = new OpenAI({ apiKey: openaiKey });

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
      const docRef = await db.collection("coverLetters").add({
        userId: request.auth.uid,
        jobTitle,
        company,
        content: coverLetter,
        createdAt: FieldValue.serverTimestamp(),
      });

      return { id: docRef.id, content: coverLetter };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Cover letter error:", message);
      throw new HttpsError("internal", "Failed to generate cover letter");
    }
  }
);
