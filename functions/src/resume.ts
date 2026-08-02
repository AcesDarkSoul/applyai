import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "./index";
import { FieldValue } from "firebase-admin/firestore";
import OpenAI from "openai";
import { openaiApiKey } from "./secrets";

import zlib from "zlib";

const RESUME_PARSE_PROMPT = `You are a strict, precision-grade AI ATS Resume Parser.
Your job is to extract candidate information STRICTLY AND EXCLUSIVELY from the provided resume text.

CRITICAL EXTRACTION RULES:
1. DO NOT fabricate, guess, estimate, or invent ANY data.
2. If a field is NOT explicitly mentioned or directly stated in the resume text (e.g. phone number, location, preferred location, expected salary, work authorization, LinkedIn URL), return null for that field.
3. Candidate Name: Extract the exact full name from the top header of the resume.
4. Skills: Extract ONLY technical skills, tools, frameworks, languages, and competencies explicitly written in the resume text.
5. Experience (years): Calculate total years of experience as a number (e.g. 3.5 or 0) based ONLY on employment date ranges in the resume. Return 0 if student or fresher with no work dates.
6. Education: Extract ONLY real education entries (institution, degree, field of study, startYear, endYear) explicitly stated in the resume text. DO NOT output dummy institutions or assumed years.
7. Summary: Extract from resume summary section or synthesize a 2-3 sentence overview using ONLY actual candidate experience mentioned in the text.
8. ATS Score (0-100): Realistic ATS score based on contact completeness, formatting clarity, and skill density in the provided text.

Return ONLY valid JSON matching this exact structure:
{
  "name": "full name string or null",
  "email": "email string or null",
  "phone": "phone number string or null",
  "location": "city/state/country or null",
  "preferredLocation": "preferred location or null",
  "expectedSalary": "salary string or null",
  "workAuthorization": "visa/work authorization or null",
  "linkedin": "LinkedIn URL or null",
  "skills": ["skill1", "skill2"],
  "experience": number,
  "education": [{"institution": "string", "degree": "string", "field": "string", "startYear": 2020, "endYear": 2024}],
  "certifications": ["cert1"],
  "projects": [{"name": "string", "description": "string", "technologies": ["tech1"]}],
  "languages": ["language1"],
  "summary": "summary text or null",
  "atsScore": 85
}`;

async function extractTextFromBase64(base64: string, fileName: string): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf")) {
    // 1. Try pdf-parse standard API
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      if (data && data.text && data.text.trim().length > 50) {
        return data.text.substring(0, 15000);
      }
    } catch (e) {
      console.warn("pdf-parse error:", e);
    }

    // 2. Inflate zlib/FlateDecode stream objects from binary PDF
    try {
      const raw = buffer.toString("binary");
      const textChunks: string[] = [];
      const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
      let match: RegExpExecArray | null;

      while ((match = streamRegex.exec(raw)) !== null) {
        const streamBuf = Buffer.from(match[1], "binary");
        let decompressed = "";
        try {
          decompressed = zlib.inflateSync(streamBuf).toString("utf-8");
        } catch {
          try {
            decompressed = zlib.unzipSync(streamBuf).toString("utf-8");
          } catch {
            decompressed = streamBuf.toString("utf-8");
          }
        }

        const textMatches = decompressed.match(/\(([^()]*)\)\s*T[jJ]|\[([^\]]*)\]\s*TJ/g);
        if (textMatches) {
          for (const tm of textMatches) {
            const cleaned = tm
              .replace(/\\\(|\x5C\x29/g, "")
              .replace(/[()[\]]/g, "")
              .replace(/\s*T[jJ]\s*/g, "")
              .replace(/-?\d+/g, "")
              .trim();
            if (cleaned.length > 1) {
              textChunks.push(cleaned);
            }
          }
        } else {
          const words = decompressed.match(/[a-zA-Z0-9.+@#/\\-]{2,}/g) || [];
          if (words.length > 4) {
            textChunks.push(words.join(" "));
          }
        }
      }

      const inflatedText = textChunks.join(" ").replace(/\s+/g, " ").trim();
      if (inflatedText.length > 30) {
        return inflatedText.substring(0, 15000);
      }
    } catch (e) {
      console.warn("Stream inflation failed:", e);
    }
  }

  const utf8 = buffer.toString("utf-8");
  if (utf8.length > 50 && !utf8.includes("\u0000")) {
    return utf8.substring(0, 15000);
  }

  const asciiOnly = utf8.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
  return asciiOnly.substring(0, 15000) || `Resume file: ${fileName}`;
}

export const parseResume = onCall(
  { maxInstances: 10, timeoutSeconds: 90, secrets: [openaiApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const userId = request.auth.uid;
    const { resumeBase64, fileName, resumeUrl } = request.data as {
      resumeBase64?: string;
      fileName?: string;
      resumeUrl?: string;
    };

    const openaiKey = openaiApiKey.value();
    if (!openaiKey) {
      throw new HttpsError("failed-precondition", "OpenAI API key not configured");
    }

    let textContent = "";

    if (resumeBase64 && fileName) {
      if (resumeBase64.length > 14_000_000) {
        throw new HttpsError("invalid-argument", "Resume file too large (max ~10MB)");
      }
      textContent = await extractTextFromBase64(resumeBase64, fileName);
    } else if (resumeUrl) {
      throw new HttpsError(
        "invalid-argument",
        "Cloud storage resumes are deprecated. Send resumeBase64 from local device."
      );
    } else {
      throw new HttpsError("invalid-argument", "resumeBase64 and fileName are required");
    }

    try {
      const openai = new OpenAI({ apiKey: openaiKey });

      let completion;
      try {
        completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: RESUME_PARSE_PROMPT },
            { role: "user", content: textContent },
          ],
          temperature: 0.1,
          max_tokens: 2500,
          response_format: { type: "json_object" },
        });
      } catch (err: unknown) {
        console.warn("gpt-4o failed, falling back to gpt-4o-mini:", err);
        completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: RESUME_PARSE_PROMPT },
            { role: "user", content: textContent },
          ],
          temperature: 0.1,
          max_tokens: 2500,
          response_format: { type: "json_object" },
        });
      }

      const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");

      const profileUpdate: Record<string, unknown> = {
        skills: Array.isArray(parsed.skills) ? parsed.skills.map((s: string) => String(s).trim()).filter(Boolean).slice(0, 50) : [],
        experience: typeof parsed.experience === "number" && !isNaN(parsed.experience) ? parsed.experience : 0,
        education: Array.isArray(parsed.education) ? parsed.education.slice(0, 10) : [],
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications.slice(0, 20) : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects.slice(0, 10) : [],
        languages: Array.isArray(parsed.languages) ? parsed.languages.slice(0, 10) : [],
        summary: typeof parsed.summary === "string" ? parsed.summary.substring(0, 800) : "",
        atsScore:
          typeof parsed.atsScore === "number" && !isNaN(parsed.atsScore)
            ? Math.min(100, Math.max(0, parsed.atsScore))
            : 70,
        hasResume: true,
        resumeFileName: fileName || "resume.pdf",
        parseStatus: "complete",
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (typeof parsed.name === "string" && parsed.name.trim()) {
        profileUpdate.name = parsed.name.trim().substring(0, 100);
      }
      if (typeof parsed.phone === "string" && parsed.phone.trim()) {
        profileUpdate.phone = parsed.phone.trim().substring(0, 30);
      }
      if (typeof parsed.email === "string" && parsed.email.trim()) {
        profileUpdate.email = parsed.email.trim().substring(0, 100);
      }
      if (typeof parsed.location === "string" && parsed.location.trim()) {
        profileUpdate.preferredLocation = parsed.location.trim().substring(0, 100);
      } else if (typeof parsed.preferredLocation === "string" && parsed.preferredLocation.trim()) {
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

      await db.collection("users").doc(userId).set(profileUpdate, { merge: true });

      return { success: true, profile: profileUpdate, parsedRaw: parsed };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Resume parse error:", message);
      throw new HttpsError("internal", "Failed to parse resume: " + message);
    }
  }
);
