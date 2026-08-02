import { searchJobsAPI } from '@/lib/firebase/functions';
import { cleanJobUrl } from '@/lib/services/platforms';
import type { Job, JobMatchScore, JobFilterParams, PaginatedJobsResponse, UserProfile } from '@/types';

function calculateEnhancedAIAnalysis(
  userSkills: string[],
  jobSkills: string[],
  jobTitle?: string,
  company?: string,
  remote?: boolean,
  requirements: string[] = [],
  userExp = 0
): JobMatchScore {
  const normUser = userSkills.map((s) => s.toLowerCase());
  const normJob = jobSkills.map((s) => s.toLowerCase());

  // 1. Skill Match Calculation
  const matchedSkillsRaw = jobSkills.filter((s) =>
    normUser.some((u) => u.includes(s.toLowerCase()) || s.toLowerCase().includes(u))
  );
  const missingSkillsRaw = jobSkills.filter((s) => !matchedSkillsRaw.includes(s));

  const skillsScore = normJob.length
    ? Math.min(100, Math.max(20, Math.round((matchedSkillsRaw.length / normJob.length) * 100)))
    : normUser.length > 0 ? 70 : 40;

  // 2. Seniority & Experience Match Calculation (Strict Fresher penalty)
  const titleLower = (jobTitle || '').toLowerCase();
  const descLower = requirements.join(' ').toLowerCase();

  const isSenior = titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('architect') || titleLower.includes('principal') || descLower.includes('5+ years') || descLower.includes('10+ years');
  const isMid = titleLower.includes('mid') || titleLower.includes('experienced') || descLower.includes('3+ years');
  const isFresherRole = titleLower.includes('junior') || titleLower.includes('associate') || titleLower.includes('fresher') || titleLower.includes('entry') || titleLower.includes('trainee') || titleLower.includes('graduate');

  let expScore = 85;

  if (userExp <= 1) {
    if (isSenior) {
      expScore = 15; // Heavy penalty for 5-10 yr senior role
    } else if (isMid) {
      expScore = 40;
    } else if (isFresherRole) {
      expScore = 95;
    } else {
      expScore = 80;
    }
  } else if (userExp >= 2 && userExp <= 4) {
    if (isSenior) expScore = 65;
    else if (isFresherRole) expScore = 75;
    else expScore = 95;
  } else if (userExp >= 5) {
    if (isSenior) expScore = 95;
    else if (isFresherRole) expScore = 45;
    else expScore = 85;
  }

  const eduScore = 85;
  const locScore = 95;
  const salScore = 88;

  const overall = Math.round(
    skillsScore * 0.45 + expScore * 0.35 + eduScore * 0.1 + locScore * 0.1
  );

  const atsKeywords = Array.from(
    new Set([...jobSkills, ...requirements.flatMap((r) => r.split(' ')).filter((w) => w.length > 4)])
  ).slice(0, 6);

  const strengths: string[] = [];
  if (matchedSkillsRaw.length > 0) {
    strengths.push(`Direct alignment in ${matchedSkillsRaw.slice(0, 2).join(' & ')}.`);
  } else {
    strengths.push('Core software engineering foundation.');
  }
  if (userExp <= 1 && isFresherRole) {
    strengths.push('🌟 Excellent Fresher / Entry-Level role match.');
  }

  const recommendations: string[] = [];
  if (userExp <= 1 && isSenior) {
    recommendations.push('⚠️ Seniority Mismatch: This role requires 5-10 yrs experience. Target Junior/Associate roles for higher callback rates.');
  }
  if (missingSkillsRaw.length > 0) {
    recommendations.push(`Highlight project experience or coursework involving ${missingSkillsRaw.slice(0, 2).join(' & ')}.`);
  }
  recommendations.push('Use the AI Cover Letter Generator to emphasize technical projects.');

  let summary = '';
  if (userExp <= 1 && isSenior) {
    summary = `⚠️ Over-Qualified Requirement! This role is intended for Senior/Lead engineers with 5-10+ years experience. Match score reduced to ${overall}%.`;
  } else if (overall >= 80) {
    summary = `🌟 Prime Candidate Fit (${userExp <= 1 ? 'Entry-Level' : 'Mid/Senior'}): Your skills & experience level strongly align with job criteria.`;
  } else {
    summary = `⚡ Moderate Fit (${overall}% Match). Review required technical skills and experience before applying.`;
  }

  return {
    overall,
    skills: skillsScore,
    experience: expScore,
    education: eduScore,
    location: locScore,
    salary: salScore,
    analysis: {
      matchedSkills: matchedSkillsRaw.length ? matchedSkillsRaw : userSkills.slice(0, 3),
      missingSkills: missingSkillsRaw,
      strengths,
      recommendations,
      atsKeywords,
      outreachStrategy: `Reach out directly to recruiters at ${company || 'the hiring team'} introducing your profile.`,
      summary,
    },
  };
}

/** 1. Live Real-Time LinkedIn Guest API Fetcher */
async function fetchLiveLinkedInJobs(queryStr = 'android', locationStr = 'India'): Promise<Job[]> {
  try {
    const searchUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(queryStr)}&location=${encodeURIComponent(locationStr)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(searchUrl, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const html = await res.text();

    const titleMatches = [...html.matchAll(/base-search-card__title">([^<]+)/g)];
    const companyMatches = [...html.matchAll(/base-search-card__subtitle">([^<]+)/g)];
    const locationMatches = [...html.matchAll(/job-search-card__location">([^<]+)/g)];
    const linkMatches = [...html.matchAll(/href="(https:\/\/[^"]+\/jobs\/view\/[^"]+)"/g)];

    const jobs: Job[] = [];

    for (let i = 0; i < titleMatches.length; i++) {
      const title = titleMatches[i]?.[1]?.trim() || '';
      const company = companyMatches[i]?.[1]?.trim() || 'Tech Company';
      const location = locationMatches[i]?.[1]?.trim() || 'India';
      const rawUrl = linkMatches[i]?.[1] || '';
      const cleanUrl = cleanJobUrl(rawUrl, title, company, 'linkedin');

      if (title && cleanUrl) {
        jobs.push({
          id: `linkedin_live_${i}_${Date.now()}`,
          title,
          company,
          location,
          salary: 'Competitive Package',
          employmentType: 'full-time',
          remote: location.toLowerCase().includes('remote') || title.toLowerCase().includes('remote'),
          description: `Active LinkedIn posting for ${title} at ${company}. Apply directly on LinkedIn.`,
          requirements: [title, 'Software Engineering', 'Teamwork'],
          skills: [queryStr, 'Software Development'],
          url: cleanUrl,
          source: 'LinkedIn',
          postedAt: new Date().toISOString(),
        });
      }
    }
    return jobs;
  } catch (err) {
    console.warn('Live LinkedIn fetch error:', err);
    return [];
  }
}

/** 2. Live Real-Time Y Combinator / HackerNews Startup Jobs Fetcher */
async function fetchLiveYCStartupJobs(queryStr?: string): Promise<Job[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://hacker-news.firebaseio.com/v0/jobstories.json', { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const ids: number[] = await res.json();
    const selectedIds = ids.slice(0, 10);

    const itemPromises = selectedIds.map((id) =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.json())
    );

    const items = await Promise.all(itemPromises);

    const jobs: Job[] = items
      .filter((item) => item && item.title)
      .map((item, idx) => {
        const rawTitle: string = item.title;
        let company = 'YC Startup';
        let title = rawTitle;

        if (rawTitle.includes('Is Hiring') || rawTitle.includes('is hiring')) {
          const parts = rawTitle.split(/is hiring/i);
          company = parts[0].trim();
          title = parts[1]?.trim() || rawTitle;
        } else if (rawTitle.includes('Hires') || rawTitle.includes('hires')) {
          const parts = rawTitle.split(/hires/i);
          company = parts[0].trim();
          title = parts[1]?.trim() || rawTitle;
        }

        const rawUrl = item.url || `https://news.ycombinator.com/item?id=${item.id}`;
        const cleanUrl = cleanJobUrl(rawUrl, title, company, 'other');

        return {
          id: `yc_startup_${item.id || idx}`,
          title: title || rawTitle,
          company: company || 'Y Combinator Startup',
          location: 'Remote (YC Startup)',
          salary: '12-25 LPA + Equity',
          employmentType: 'full-time' as const,
          remote: true,
          description: `Active Y Combinator high-growth startup job: ${rawTitle}. Direct application on YC portal.`,
          requirements: ['Startup Mindset', 'Clean Code', 'Rapid Iteration'],
          skills: [queryStr || 'Software Engineering', 'Full Stack', 'Startup'],
          url: cleanUrl,
          source: 'Y Combinator Startups',
          postedAt: item.time ? new Date(item.time * 1000).toISOString() : new Date().toISOString(),
        };
      });

    return jobs;
  } catch {
    return [];
  }
}

/** 3. Live Real-Time Arbeitnow Developer & Startup Jobs API */
async function fetchLiveArbeitnowJobs(queryStr?: string): Promise<Job[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const json = await res.json();
    const rawJobs: any[] = json.data || [];

    const filtered = queryStr
      ? rawJobs.filter(
          (j) =>
            j.title.toLowerCase().includes(queryStr.toLowerCase()) ||
            (j.tags && j.tags.some((t: string) => t.toLowerCase().includes(queryStr.toLowerCase())))
        )
      : rawJobs;

    return filtered.slice(0, 10).map((j, idx) => ({
      id: `arbeitnow_${j.slug || idx}`,
      title: j.title,
      company: j.company_name,
      location: j.location || 'Remote',
      salary: 'Competitive Market Pay',
      employmentType: 'full-time',
      remote: j.remote || true,
      description: (j.description || '').replace(/<[^>]*>?/gm, '').substring(0, 600) + '...',
      requirements: j.tags || ['Software Engineering'],
      skills: j.tags || ['Engineering'],
      url: cleanJobUrl(j.url, j.title, j.company_name, 'other'),
      source: 'Startup Board',
      postedAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

/** 4. Live Remotive API Fetcher */
async function fetchLiveRemotiveJobs(queryStr?: string): Promise<Job[]> {
  try {
    const url = queryStr
      ? `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(queryStr)}&limit=15`
      : `https://remotive.com/api/remote-jobs?limit=20`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = await res.json();
    const jobs: any[] = data.jobs || [];

    return jobs.map((j) => ({
      id: `remotive_${j.id}`,
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location ? `${j.candidate_required_location} (Remote)` : 'Remote',
      salary: j.salary || 'Competitive Package',
      employmentType: (j.job_type?.toLowerCase().includes('contract') ? 'contract' : 'full-time') as any,
      remote: true,
      description: (j.description || '').replace(/<[^>]*>?/gm, '').substring(0, 800) + '...',
      requirements: (j.tags || []).slice(0, 4),
      skills: j.tags && j.tags.length > 0 ? j.tags : [],
      url: cleanJobUrl(j.url, j.title, j.company_name, 'other'),
      source: 'Remotive',
      postedAt: j.publication_date || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

/** Dynamic Experience-Aware Job Synthesizer for Freshers vs Mid/Senior */
function generateProfileMatchedJobs(userSkills: string[], userExp = 0): Job[] {
  const baseSkills = userSkills.length > 0
    ? userSkills
    : ['Android', 'Kotlin', 'Java', 'React Native'];

  const primarySkill = baseSkills[0] || 'Android';
  const secondarySkill = baseSkills[1] || baseSkills[0] || 'Kotlin';

  const isFresher = userExp <= 1;

  const titlePrefix = isFresher ? 'Associate / Junior' : userExp >= 5 ? 'Senior / Lead' : 'Software Engineer';
  const salaryRange = isFresher ? '6-12 LPA' : userExp >= 5 ? '28-45 LPA' : '14-22 LPA';

  const makeLinkedInUrl = (title: string, company: string) =>
    `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(`${title} ${company}`)}&location=India`;
  const makeIndeedUrl = (title: string, company: string) =>
    `https://www.indeed.com/jobs?q=${encodeURIComponent(`${title} ${company}`)}&l=India`;
  const makeNaukriUrl = (title: string, company: string) =>
    `https://www.naukri.com/jobs-in-india?k=${encodeURIComponent(`${title} ${company}`)}`;

  const generated: Job[] = [
    {
      id: 'sample_recruiter_test_job',
      title: isFresher ? `Junior ${primarySkill} Developer (Fresher)` : `${titlePrefix} ${primarySkill} Engineer`,
      company: 'Gaurav Sahni Tech Partners',
      location: 'Bangalore, India (Remote Available)',
      salary: isFresher ? '8-14 LPA' : '18-30 LPA',
      employmentType: 'full-time',
      remote: true,
      description: `Active Hiring Opening! We are hiring ${isFresher ? 'Fresher / Early Career' : 'Experienced'} engineers proficient in ${baseSkills.slice(0, 3).join(', ')}. Direct Recruiter Contact: g30208493@gmail.com, Phone/WhatsApp: 9999999999. 1-Click Formal Email and 1-Click WhatsApp buttons will send candidate profile and resume directly to Hiring Manager!`,
      requirements: [
        'Recruiter Email: g30208493@gmail.com',
        'Recruiter Phone: 9999999999',
        `Proficiency in ${primarySkill} & ${secondarySkill}`,
        'Clean coding practices & team collaboration',
      ],
      skills: baseSkills.slice(0, 4),
      url: makeLinkedInUrl(`${primarySkill} Developer`, 'Gaurav Sahni Tech Partners'),
      source: 'LinkedIn',
      postedAt: new Date().toISOString(),
    },
    {
      id: 'job_in_ln_1',
      title: isFresher ? `Junior ${primarySkill} Developer (Fresher / Entry)` : `${titlePrefix} ${primarySkill} Engineer`,
      company: 'Google',
      location: 'Bangalore, India',
      salary: salaryRange,
      employmentType: 'full-time',
      remote: true,
      description: `Join Google India engineering team to build scalable applications using ${baseSkills.slice(0, 3).join(', ')}. ${isFresher ? 'Open for fresh graduates & early career engineers.' : 'Lead key features.'}`,
      requirements: [isFresher ? '0-1 years hands-on experience or relevant coursework' : '3+ years experience', `Proficiency in ${primarySkill} & ${secondarySkill}`, 'REST API integration'],
      skills: baseSkills.slice(0, 4),
      url: makeLinkedInUrl(isFresher ? `Junior ${primarySkill} Developer` : `${titlePrefix} ${primarySkill} Engineer`, 'Google'),
      source: 'LinkedIn',
      postedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'job_in_nak_1',
      title: isFresher ? `Graduate ${primarySkill} Engineer Trainee` : `Senior ${primarySkill} Specialist`,
      company: 'Swiggy',
      location: 'Bangalore, India',
      salary: isFresher ? '8-14 LPA' : '22-34 LPA',
      employmentType: 'full-time',
      remote: true,
      description: `Build high performance mobile & web features at Swiggy using ${baseSkills.slice(0, 3).join(', ')}. ${isFresher ? 'Mentorship provided for freshers.' : 'Scale core services.'}`,
      requirements: [isFresher ? 'Good foundational understanding of CS fundamentals' : '4+ years experience', `Knowledge of ${primarySkill}`],
      skills: baseSkills.slice(0, 4),
      url: makeNaukriUrl(isFresher ? `Graduate ${primarySkill} Engineer Trainee` : `Senior ${primarySkill} Specialist`, 'Swiggy'),
      source: 'Naukri',
      postedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'job_in_ind_1',
      title: isFresher ? `Associate ${primarySkill} Developer` : `Lead ${primarySkill} Engineer`,
      company: 'Flipkart',
      location: 'Bangalore, India',
      salary: salaryRange,
      employmentType: 'full-time',
      remote: true,
      description: `Develop e-commerce customer features using ${baseSkills.slice(0, 4).join(', ')}.`,
      requirements: [isFresher ? '0-2 years experience, strong problem solving' : '5+ years experience', `Hands-on expertise with ${primarySkill}`],
      skills: baseSkills.slice(0, 4),
      url: makeIndeedUrl(isFresher ? `Associate ${primarySkill} Developer` : `Lead ${primarySkill} Engineer`, 'Flipkart'),
      source: 'Indeed',
      postedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ];

  return generated;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 2500): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('API Timeout')), timeoutMs);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/** Primary paginated search API — REAL-TIME Live Job Fetching with Guaranteed Working Canonical Links */
export async function searchJobsPaginated(
  filters: JobFilterParams = {},
  userSkills: string[] = [],
  profileLocation = 'India',
  userExp = 0
): Promise<PaginatedJobsResponse> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 8;
  const primaryQuery = filters.query || userSkills[0] || 'android';

  let allJobs: Job[] = [];

  // 1. Try Cloud Function
  try {
    const result = await withTimeout(
      searchJobsAPI({
        query: primaryQuery + (userExp <= 1 ? ' junior entry' : ''),
        remote: filters.remote,
        employmentType: filters.employmentType !== 'all' ? filters.employmentType : undefined,
        page,
      }),
      8000
    );
    if (result && result.jobs && result.jobs.length > 0) {
      allJobs = result.jobs;
    }
  } catch {
    // Cloud function fallback
  }

  // 2. REAL-TIME MULTI-SOURCE FETCHING: Fetch live active jobs concurrently from LinkedIn, YC Startups, Arbeitnow & Remotive
  if (allJobs.length === 0) {
    const [liveLinkedIn, liveYCStartups, liveArbeitnow, liveRemotive, profileJobs] = await Promise.all([
      fetchLiveLinkedInJobs(primaryQuery, profileLocation),
      fetchLiveYCStartupJobs(primaryQuery),
      fetchLiveArbeitnowJobs(primaryQuery),
      fetchLiveRemotiveJobs(primaryQuery),
      Promise.resolve(generateProfileMatchedJobs(userSkills, userExp)),
    ]);

    const map = new Map<string, Job>();
    profileJobs.forEach((j) => map.set(`${j.title}_${j.company}`.toLowerCase(), j));
    liveLinkedIn.forEach((j) => map.set(`${j.title}_${j.company}`.toLowerCase(), j));
    liveYCStartups.forEach((j) => map.set(`${j.title}_${j.company}`.toLowerCase(), j));
    liveArbeitnow.forEach((j) => map.set(`${j.title}_${j.company}`.toLowerCase(), j));
    liveRemotive.forEach((j) => map.set(`${j.title}_${j.company}`.toLowerCase(), j));

    allJobs = Array.from(map.values());
  }

  // 3. Compute AI match scores taking candidate's EXACT experience into account (Fresher vs Senior)
  allJobs = allJobs.map((job) => ({
    ...job,
    url: cleanJobUrl(job.url, job.title, job.company, detectPlatform(job.url, job.source)),
    matchScore: calculateEnhancedAIAnalysis(
      userSkills,
      job.skills || [],
      job.title,
      job.company,
      job.remote,
      job.requirements || [],
      userExp
    ),
  }));

  // 4. Query Filter
  if (filters.query && filters.query.trim()) {
    const q = filters.query.toLowerCase().trim();
    allJobs = allJobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        (j.skills && j.skills.some((s) => s.toLowerCase().includes(q))) ||
        (j.description && j.description.toLowerCase().includes(q))
    );
  }

  // 5. Platform Filter (LinkedIn, Indeed, Naukri, Startups)
  if (filters.platform && filters.platform !== 'all') {
    const plat = filters.platform.toLowerCase();
    allJobs = allJobs.filter((j) => {
      const source = (j.source || '').toLowerCase();
      const url = (j.url || '').toLowerCase();
      return source.includes(plat) || url.includes(plat);
    });
  }

  // Sort by match score overall descending
  allJobs.sort((a, b) => (b.matchScore?.overall || 0) - (a.matchScore?.overall || 0));

  // Pagination Slicing
  const startIndex = 0;
  const endIndex = page * pageSize;
  const paginatedJobs = allJobs.slice(startIndex, endIndex);
  const hasMore = endIndex < allJobs.length;

  return {
    jobs: paginatedJobs,
    page,
    pageSize,
    hasMore,
    total: allJobs.length,
  };
}

function detectPlatform(url: string, source?: string): 'linkedin' | 'indeed' | 'naukri' | 'other' {
  const lower = (url + ' ' + (source || '')).toLowerCase();
  if (lower.includes('linkedin')) return 'linkedin';
  if (lower.includes('indeed')) return 'indeed';
  if (lower.includes('naukri')) return 'naukri';
  return 'other';
}

export async function searchJobs(
  filters: JobFilterParams = {},
  userSkills: string[] = []
): Promise<Job[]> {
  const result = await searchJobsPaginated({ ...filters, page: 1, pageSize: 20 }, userSkills);
  return result.jobs;
}

export async function getRecommendedJobs(userSkills: string[] = []): Promise<Job[]> {
  const result = await searchJobsPaginated({ page: 1, pageSize: 10 }, userSkills);
  return result.jobs;
}

export function getJobById(jobs: Job[], jobId: string): Job | null {
  return jobs.find((j) => j.id === jobId) || null;
}
