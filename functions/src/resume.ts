import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "./index";
import { FieldValue } from "firebase-admin/firestore";
import OpenAI from "openai";
import { openaiApiKey } from "./secrets";

const RESUME_PARSE_PROMPT = `You are a world-class AI ATS Resume Parser and Career Intelligence Engine.
Your goal is to accurately extract, estimate, and structure ALL information from candidate resume content regardless of non-standard section titles, formatting variations, or layout styles.

FLEXIBLE HEADING ESTIMATION & MAPPING INSTRUCTIONS:
1. Candidate Name: Extract from the header, top of document, or infer from email/filename if missing.
2. Skills: Map ANY section related to "Skills", "Technical Skills", "Technologies", "Tech Stack", "Tools & Frameworks", "Core Competencies", "Proficiencies", "Domain Knowledge", "Key Strengths", "Expertise", "What I Do", or inline in job descriptions. Extract technical skills, tools, frameworks, and key soft skills.
3. Total Experience (years): Calculate total professional experience in years by summing date ranges across "Experience", "Work History", "Employment", "Professional Journey", "Career History", "Roles", "Positions", "Assignments", "Internships", "Where I've Worked". If dates are missing, estimate intelligently based on seniority & role dates (e.g. 0 for fresher/student, 3-5 mid, 6+ senior).
4. Education: Map "Education", "Academic Background", "Qualifications", "Degrees", "Academic History", "Schooling", "Studies", "Training". Extract institution, degree, field of study, startYear, and endYear.
5. Certifications: Map "Certifications", "Licenses", "Credentials", "Courses", "Certificates", "Accreditations", "Professional Development".
6. Projects: Map "Projects", "Key Projects", "Portfolio", "Personal Projects", "Highlights", "Work Samples", "Building".
7. Languages: Spoken/written languages listed anywhere in document.
8. Summary: Extract from "Summary", "Profile", "About Me", "Objective", "Executive Summary", "Bio", "Overview", or synthesize a 2-3 sentence summary based on their role and background.
9. ATS Score (0-100): Estimate ATS compliance based on layout clarity, contact details completeness, clear timeline, and skill density.

Return ONLY valid JSON with this exact structure:
{
  "name": "full name string",
  "email": "email string or null",
  "phone": "phone string or null",
  "location": "city/state/country or null",
  "preferredLocation": "preferred location or Remote",
  "expectedSalary": "salary or null",
  "workAuthorization": "work authorization/visa or null",
  "linkedin": "LinkedIn URL or null",
  "skills": ["skill1", "skill2"],
  "experience": number,
  "education": [{"institution": "string", "degree": "string", "field": "string", "startYear": 2020, "endYear": 2024}],
  "certifications": ["cert1"],
  "projects": [{"name": "string", "description": "string", "technologies": ["tech1"]}],
  "languages": ["language1"],
  "summary": "professional summary text",
  "atsScore": 85
}`;

async function extractTextFromBase64(base64: string, fileName: string): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf")) {
    // 1. Try pdf-parse v2 API
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfModule = require("pdf-parse");
      if (pdfModule.PDFParse) {
        const parser = new pdfModule.PDFParse({ data: buffer });
        await parser.load();
        const res = await parser.getText();
        const textStr = typeof res === "string" ? res : res?.text || "";
        if (textStr.trim().length > 30) {
          return textStr.substring(0, 12000);
        }
      }
      if (typeof pdfModule === "function") {
        const data = await pdfModule(buffer);
        if (data.text?.trim().length > 30) {
          return data.text.substring(0, 12000);
        }
      }
    } catch (e) {
      console.warn("PDF parse library error:", e);
    }

    // 2. Fallback: Raw PDF stream regex extraction
    try {
      const raw = buffer.toString("binary");
      const matches: string[] = [];
      const regex = /\(([^()]*)\)\s*T[jJ]/g;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(raw)) !== null) {
        if (m[1] && m[1].length > 1) {
          matches.push(m[1]);
        }
      }
      const extracted = matches.join(" ").replace(/\\./g, " ").replace(/\s+/g, " ").trim();
      if (extracted.length > 50) {
        return extracted.substring(0, 12000);
      }
    } catch (e) {
      console.warn("Raw PDF regex extraction failed:", e);
    }
  }

  const utf8 = buffer.toString("utf-8");
  if (utf8.length > 100 && !utf8.includes("\u0000")) {
    return utf8.substring(0, 12000);
  }

  return `Resume file: ${fileName}. Extractable text: ${utf8.replace(/[^\x20-\x7E\n\r\t]/g, " ").substring(0, 3000)}`;
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

      const profileUpdate: Record<string, unknown> = {
        skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 50) : [],
        experience: typeof parsed.experience === "number" ? parsed.experience : 0,
        education: Array.isArray(parsed.education) ? parsed.education.slice(0, 10) : [],
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications.slice(0, 20) : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects.slice(0, 10) : [],
        languages: Array.isArray(parsed.languages) ? parsed.languages.slice(0, 10) : [],
        summary: typeof parsed.summary === "string" ? parsed.summary.substring(0, 500) : "",
        atsScore:
          typeof parsed.atsScore === "number" ? Math.min(100, Math.max(0, parsed.atsScore)) : 50,
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
