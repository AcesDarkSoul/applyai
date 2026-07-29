import { onCall, HttpsError } from "firebase-functions/v2/https";
import OpenAI from "openai";
import { db } from "./index";
import { openaiApiKey } from "./secrets";

type Platform = "linkedin" | "reddit" | "twitter";
type PostType = "opentowork" | "career_update" | "job_share" | "reddit_forhire";

const PLATFORM_RULES: Record<Platform, string> = {
  linkedin: `Write a LinkedIn post. Use line breaks, 2-4 emojis, 3-5 hashtags at the end.
Tone: professional, confident, human. Max 1300 characters. Include #OpenToWork if job searching.`,
  reddit: `Write a Reddit post for job seekers. Clear title on first line prefixed "TITLE:" then body after blank line.
Tone: direct, Reddit-friendly (not corporate). Max 1000 chars body. Suggest relevant subreddit in reply metadata.`,
  twitter: `Write an X/Twitter post. Max 280 characters. 1-2 hashtags max.`,
};

export const generateSocialPost = onCall(
  { maxInstances: 10, timeoutSeconds: 45, secrets: [openaiApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const openaiKey = openaiApiKey.value();
    if (!openaiKey) {
      throw new HttpsError("failed-precondition", "OpenAI API key not configured");
    }

    const {
      platform = "linkedin",
      postType = "opentowork",
      jobTitle,
      company,
      jobUrl,
      customPrompt,
    } = request.data as {
      platform?: Platform;
      postType?: PostType;
      jobTitle?: string;
      company?: string;
      jobUrl?: string;
      customPrompt?: string;
    };

    const userDoc = await db.collection("users").doc(request.auth.uid).get();
    const profile = userDoc.data();
    if (!profile) {
      throw new HttpsError("not-found", "User profile not found");
    }

    const profileContext = `
Candidate: ${profile.name}
Skills: ${(profile.skills || []).join(", ") || "Not listed"}
Experience: ${profile.experience || 0} years
Location preference: ${profile.preferredLocation || "Remote"}
Summary: ${profile.summary || "Not provided"}
`;

    const postContext =
      postType === "job_share" && jobTitle
        ? `Highlight interest in: ${jobTitle} at ${company || "the company"}${jobUrl ? `\nJob link: ${jobUrl}` : ""}`
        : postType === "reddit_forhire"
          ? "Format as [For Hire] post with role, skills, experience, location, and contact preference."
          : postType === "career_update"
            ? "Share a positive career update about exploring new opportunities and using AI tools in job search."
            : "Create an #OpenToWork post to attract recruiters and hiring managers.";

    const systemPrompt = `You are an expert career content writer for ${platform}.
${PLATFORM_RULES[platform as Platform] || PLATFORM_RULES.linkedin}
Return JSON: { "title": "optional title for Reddit", "content": "post text", "hashtags": ["array"], "suggestedSubreddit": "only for reddit e.g. r/forhire" }`;

    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      let completion;
      try {
        completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `${profileContext}\n\nPost type: ${postType}\n${postContext}${customPrompt ? `\nExtra instructions: ${customPrompt}` : ""}`,
            },
          ],
          temperature: 0.8,
          max_tokens: 800,
          response_format: { type: "json_object" },
        });
      } catch (err: unknown) {
        console.warn("gpt-4o failed in generateSocialPost, falling back to gpt-4o-mini:", err);
        completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `${profileContext}\n\nPost type: ${postType}\n${postContext}${customPrompt ? `\nExtra instructions: ${customPrompt}` : ""}`,
            },
          ],
          temperature: 0.8,
          max_tokens: 800,
          response_format: { type: "json_object" },
        });
      }

      const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
      return {
        title: parsed.title || "",
        content: parsed.content || "",
        hashtags: parsed.hashtags || [],
        suggestedSubreddit: parsed.suggestedSubreddit || "",
        platform,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Social post error:", message);
      throw new HttpsError("internal", "Failed to generate post");
    }
  }
);
