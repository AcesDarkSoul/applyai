"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSocialPost = void 0;
const https_1 = require("firebase-functions/v2/https");
const openai_1 = __importDefault(require("openai"));
const index_1 = require("./index");
const secrets_1 = require("./secrets");
const PLATFORM_RULES = {
    linkedin: `Write a LinkedIn post. Use line breaks, 2-4 emojis, 3-5 hashtags at the end.
Tone: professional, confident, human. Max 1300 characters. Include #OpenToWork if job searching.`,
    reddit: `Write a Reddit post for job seekers. Clear title on first line prefixed "TITLE:" then body after blank line.
Tone: direct, Reddit-friendly (not corporate). Max 1000 chars body. Suggest relevant subreddit in reply metadata.`,
    twitter: `Write an X/Twitter post. Max 280 characters. 1-2 hashtags max.`,
};
exports.generateSocialPost = (0, https_1.onCall)({ maxInstances: 10, timeoutSeconds: 45, secrets: [secrets_1.openaiApiKey] }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be logged in");
    }
    const openaiKey = secrets_1.openaiApiKey.value();
    if (!openaiKey) {
        throw new https_1.HttpsError("failed-precondition", "OpenAI API key not configured");
    }
    const { platform = "linkedin", postType = "opentowork", jobTitle, company, jobUrl, customPrompt, } = request.data;
    const userDoc = await index_1.db.collection("users").doc(request.auth.uid).get();
    const profile = userDoc.data();
    if (!profile) {
        throw new https_1.HttpsError("not-found", "User profile not found");
    }
    const profileContext = `
Candidate: ${profile.name}
Skills: ${(profile.skills || []).join(", ") || "Not listed"}
Experience: ${profile.experience || 0} years
Location preference: ${profile.preferredLocation || "Remote"}
Summary: ${profile.summary || "Not provided"}
`;
    const postContext = postType === "job_share" && jobTitle
        ? `Highlight interest in: ${jobTitle} at ${company || "the company"}${jobUrl ? `\nJob link: ${jobUrl}` : ""}`
        : postType === "reddit_forhire"
            ? "Format as [For Hire] post with role, skills, experience, location, and contact preference."
            : postType === "career_update"
                ? "Share a positive career update about exploring new opportunities and using AI tools in job search."
                : "Create an #OpenToWork post to attract recruiters and hiring managers.";
    const systemPrompt = `You are an expert career content writer for ${platform}.
${PLATFORM_RULES[platform] || PLATFORM_RULES.linkedin}
Return JSON: { "title": "optional title for Reddit", "content": "post text", "hashtags": ["array"], "suggestedSubreddit": "only for reddit e.g. r/forhire" }`;
    try {
        const openai = new openai_1.default({ apiKey: openaiKey });
        const completion = await openai.chat.completions.create({
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
        const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
        return {
            title: parsed.title || "",
            content: parsed.content || "",
            hashtags: parsed.hashtags || [],
            suggestedSubreddit: parsed.suggestedSubreddit || "",
            platform,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Social post error:", message);
        throw new https_1.HttpsError("internal", "Failed to generate post");
    }
});
//# sourceMappingURL=socialPost.js.map