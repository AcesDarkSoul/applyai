import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { db } from "./index";
import { FieldValue } from "firebase-admin/firestore";
import { rapidApiKey } from "./secrets";

const JSEARCH_API_HOST = "jsearch.p.rapidapi.com";

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_employment_type: string;
  job_is_remote: boolean;
  job_description: string;
  job_required_skills: string[] | null;
  job_apply_link: string;
  job_posted_at_datetime_utc: string;
}

interface SearchParams {
  query?: string;
  page?: number;
  remote?: boolean;
  employmentType?: string;
}

function mapEmploymentType(type: string): string {
  const map: Record<string, string> = {
    FULLTIME: "full-time",
    PARTTIME: "part-time",
    CONTRACTOR: "contract",
    INTERN: "internship",
  };
  return map[type] || "full-time";
}

function formatSalary(min: number | null, max: number | null, currency: string | null): string | undefined {
  if (!min && !max) return undefined;
  const cur = currency || "INR";
  if (min && max) return `${cur} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  if (min) return `${cur} ${min.toLocaleString()}+`;
  if (max) return `Up to ${cur} ${max.toLocaleString()}`;
  return undefined;
}

function calculateMatchScore(
  userSkills: string[],
  jobSkills: string[],
  userExp: number,
  jobRemote: boolean,
  userLocation: string
) {
  const normUser = userSkills.map((s) => s.toLowerCase());
  const normJob = jobSkills.map((s) => s.toLowerCase());

  const matched = normJob.filter((s) =>
    normUser.some((u) => u.includes(s) || s.includes(u))
  );
  const skills = normJob.length
    ? Math.round((matched.length / normJob.length) * 100)
    : 50;

  const experience = Math.min(100, 60 + userExp * 5);
  const education = 75;
  const location =
    jobRemote || userLocation.toLowerCase().includes("remote") ? 100 : 65;
  const salary = 80;
  const overall = Math.round(
    (skills + experience + education + location + salary) / 5
  );

  return { overall, skills, experience, education, location, salary };
}

async function executeJobSearch(
  uid: string,
  apiKey: string,
  params: SearchParams
) {
  const {
    query = "software developer",
    page = 1,
    remote,
    employmentType,
  } = params;

  const userDoc = await db.collection("users").doc(uid).get();
  const userData = userDoc.data() || {};
  const userSkills: string[] = userData.skills || [];
  const userExp: number = userData.experience || 0;
  const userLocation: string = userData.preferredLocation || "Remote";

  const cacheKey = `${query}_${page}_${remote || ""}_${employmentType || ""}`;
  const cacheRef = db.collection("jobCache").doc(
    Buffer.from(cacheKey).toString("base64").replace(/[/+=]/g, "_").substring(0, 100)
  );
  const cached = await cacheRef.get();

  if (cached.exists) {
    const cacheData = cached.data();
    const cacheAge = Date.now() - (cacheData?.cachedAt?.toMillis?.() || 0);
    if (cacheAge < 3600000) {
      const jobs = (cacheData?.jobs || []).map((job: Record<string, unknown>) => ({
        ...job,
        matchScore: calculateMatchScore(
          userSkills,
          (job.skills as string[]) || [],
          userExp,
          job.remote as boolean,
          userLocation
        ),
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

  const response = await fetch(
    `https://${JSEARCH_API_HOST}/search-v2?${searchParams}`,
    {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": JSEARCH_API_HOST,
      },
    }
  );

  if (!response.ok) {
    throw new HttpsError("internal", `JSearch API error: ${response.status}`);
  }

  const data = await response.json();
  // JSearch v5: { data: { jobs: [] } } — legacy: { data: [] }
  const rawJobs: JSearchJob[] = Array.isArray(data?.data?.jobs)
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
    requirements: [] as string[],
    skills: j.job_required_skills || [],
    url: j.job_apply_link,
    source: "JSearch",
    postedAt: j.job_posted_at_datetime_utc,
    matchScore: calculateMatchScore(
      userSkills,
      j.job_required_skills || [],
      userExp,
      j.job_is_remote,
      userLocation
    ),
  }));

  const jobsForCache = jobs.map(({ matchScore, ...rest }) => rest);
  await cacheRef.set({
    jobs: jobsForCache,
    query: cacheKey,
    cachedAt: FieldValue.serverTimestamp(),
  });

  return {
    jobs: jobs.sort((a, b) => b.matchScore.overall - a.matchScore.overall),
    fromCache: false,
  };
}

export const searchJobs = onCall(
  { maxInstances: 20, timeoutSeconds: 30, secrets: [rapidApiKey] },
  async (request: CallableRequest) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const apiKey = rapidApiKey.value();
    if (!apiKey) {
      throw new HttpsError("failed-precondition", "RapidAPI key not configured");
    }

    return executeJobSearch(request.auth.uid, apiKey, request.data as SearchParams);
  }
);

export const getRecommendedJobs = onCall(
  { maxInstances: 20, timeoutSeconds: 30, secrets: [rapidApiKey] },
  async (request: CallableRequest) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const apiKey = rapidApiKey.value();
    if (!apiKey) {
      throw new HttpsError("failed-precondition", "RapidAPI key not configured");
    }

    const userDoc = await db.collection("users").doc(request.auth.uid).get();
    const userData = userDoc.data() || {};
    const skills: string[] = userData.skills || [];
    const location: string = userData.preferredLocation || "Remote";

    const searchQuery = skills.length > 0
      ? skills.slice(0, 3).join(" ") + " developer"
      : "software developer " + location;

    return executeJobSearch(request.auth.uid, apiKey, {
      query: searchQuery,
      page: 1,
      remote: true,
    });
  }
);
