"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendedJobs = exports.searchJobs = void 0;
const https_1 = require("firebase-functions/v2/https");
const index_1 = require("./index");
const firestore_1 = require("firebase-admin/firestore");
const secrets_1 = require("./secrets");
const userDoc_1 = require("./userDoc");
const JSEARCH_API_HOST = "jsearch.p.rapidapi.com";
function mapEmploymentType(type) {
    const map = {
        FULLTIME: "full-time",
        PARTTIME: "part-time",
        CONTRACTOR: "contract",
        INTERN: "internship",
    };
    return map[type] || "full-time";
}
function formatSalary(min, max, currency) {
    if (!min && !max)
        return undefined;
    const cur = currency || "INR";
    if (min && max)
        return `${cur} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min)
        return `${cur} ${min.toLocaleString()}+`;
    if (max)
        return `Up to ${cur} ${max.toLocaleString()}`;
    return undefined;
}
function calculateMatchScore(userSkills, jobSkills, userExp, jobRemote, userLocation) {
    const normUser = userSkills.map((s) => s.toLowerCase());
    const normJob = jobSkills.map((s) => s.toLowerCase());
    const matched = normJob.filter((s) => normUser.some((u) => u.includes(s) || s.includes(u)));
    const skills = normJob.length
        ? Math.round((matched.length / normJob.length) * 100)
        : 50;
    const experience = Math.min(100, 60 + userExp * 5);
    const education = 75;
    const location = jobRemote || userLocation.toLowerCase().includes("remote") ? 100 : 65;
    const salary = 80;
    const overall = Math.round((skills + experience + education + location + salary) / 5);
    return { overall, skills, experience, education, location, salary };
}
async function executeJobSearch(auth, apiKey, params) {
    const { query = "software developer", page = 1, remote, employmentType, } = params;
    const userProfile = await (0, userDoc_1.getUserProfileDoc)(auth);
    const userData = userProfile?.data || {};
    const userSkills = userData.skills || [];
    const userExp = userData.experience || 0;
    const userLocation = userData.preferredLocation || "Remote";
    const cacheKey = `${query}_${page}_${remote || ""}_${employmentType || ""}`;
    const cacheRef = index_1.db.collection("jobCache").doc(Buffer.from(cacheKey).toString("base64").replace(/[/+=]/g, "_").substring(0, 100));
    const cached = await cacheRef.get();
    if (cached.exists) {
        const cacheData = cached.data();
        const cacheAge = Date.now() - (cacheData?.cachedAt?.toMillis?.() || 0);
        if (cacheAge < 3600000) {
            const jobs = (cacheData?.jobs || []).map((job) => ({
                ...job,
                matchScore: calculateMatchScore(userSkills, job.skills || [], userExp, job.remote, userLocation),
            }));
            return { jobs, fromCache: true };
        }
    }
    const searchParams = new URLSearchParams({
        query,
        num_pages: "1",
        country: "in",
        ...(remote !== undefined && { remote_jobs_only: String(remote) }),
        ...(employmentType && { employment_types: employmentType.toUpperCase() }),
    });
    const response = await fetch(`https://${JSEARCH_API_HOST}/search-v2?${searchParams}`, {
        headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": JSEARCH_API_HOST,
        },
    });
    if (!response.ok) {
        throw new https_1.HttpsError("internal", `JSearch API error: ${response.status}`);
    }
    const data = await response.json();
    // JSearch v5: { data: { jobs: [] } } — legacy: { data: [] }
    const rawJobs = Array.isArray(data?.data?.jobs)
        ? data.data.jobs
        : Array.isArray(data?.data)
            ? data.data
            : [];
    const jobs = rawJobs.map((j) => ({
        id: j.job_id,
        title: j.job_title,
        company: j.employer_name,
        location: [j.job_city, j.job_state, j.job_country]
            .filter(Boolean)
            .join(", ") || "Remote",
        salary: formatSalary(j.job_min_salary, j.job_max_salary, j.job_salary_currency),
        employmentType: mapEmploymentType(j.job_employment_type),
        remote: j.job_is_remote,
        description: (j.job_description || "").substring(0, 1000),
        requirements: [],
        skills: j.job_required_skills || [],
        url: j.job_apply_link,
        source: "JSearch",
        postedAt: j.job_posted_at_datetime_utc,
        matchScore: calculateMatchScore(userSkills, j.job_required_skills || [], userExp, j.job_is_remote, userLocation),
    }));
    const jobsForCache = jobs.map(({ matchScore, ...rest }) => rest);
    await cacheRef.set({
        jobs: jobsForCache,
        query: cacheKey,
        cachedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    return {
        jobs: jobs.sort((a, b) => b.matchScore.overall - a.matchScore.overall),
        fromCache: false,
    };
}
exports.searchJobs = (0, https_1.onCall)({ maxInstances: 20, timeoutSeconds: 30, secrets: [secrets_1.rapidApiKey] }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be logged in");
    }
    const apiKey = secrets_1.rapidApiKey.value();
    if (!apiKey) {
        throw new https_1.HttpsError("failed-precondition", "RapidAPI key not configured");
    }
    return executeJobSearch(request.auth, apiKey, request.data);
});
exports.getRecommendedJobs = (0, https_1.onCall)({ maxInstances: 20, timeoutSeconds: 30, secrets: [secrets_1.rapidApiKey] }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be logged in");
    }
    const apiKey = secrets_1.rapidApiKey.value();
    if (!apiKey) {
        throw new https_1.HttpsError("failed-precondition", "RapidAPI key not configured");
    }
    const userProfile = await (0, userDoc_1.getUserProfileDoc)(request.auth);
    const userData = userProfile?.data || {};
    const skills = userData.skills || [];
    const location = userData.preferredLocation || "Remote";
    const searchQuery = skills.length > 0
        ? skills.slice(0, 3).join(" ") + " developer"
        : "software developer " + location;
    return executeJobSearch(request.auth, apiKey, {
        query: searchQuery,
        page: 1,
        remote: true,
    });
});
//# sourceMappingURL=jobs.js.map