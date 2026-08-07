import type { ResumeBuilderInput } from '../domain/resume';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function contactLine(input: ResumeBuilderInput): string {
  const parts = [
    input.email,
    input.phone,
    input.location,
    input.linkedinUrl,
    input.website,
  ].filter(Boolean);
  return parts.map((p) => esc(String(p))).join(' · ');
}

export function scoreAdvanced(input: ResumeBuilderInput): number {
  let score = 38;
  if (input.displayName) score += 5;
  if (input.title) score += 5;
  if (input.email) score += 4;
  if (input.phone) score += 4;
  if (input.location) score += 3;
  if (input.linkedinUrl) score += 3;
  if (input.summary && input.summary.length > 140) score += 10;
  else if (input.summary && input.summary.length > 60) score += 6;
  else if (input.summary) score += 3;
  if (input.skills.length >= 10) score += 10;
  else if (input.skills.length >= 6) score += 8;
  else if (input.skills.length >= 3) score += 5;
  const strongBullets = input.experience.reduce(
    (n, e) => n + (e.bullets || []).filter((b) => b.trim().length > 25).length,
    0,
  );
  if (input.experience.length >= 2) score += 8;
  else if (input.experience.length === 1) score += 5;
  if (strongBullets >= 4) score += 8;
  else if (strongBullets >= 2) score += 4;
  if (input.education.length) score += 5;
  if (input.projects.length) score += 4;
  if (input.certifications.length) score += 3;
  if (input.achievements.length) score += 3;
  if (input.languages.length) score += 2;
  return Math.min(98, score);
}

export function atsTips(input: ResumeBuilderInput): string[] {
  const tips: string[] = [];
  if (!input.phone) tips.push('Add a phone number — recruiters still dial candidates.');
  if (!input.linkedinUrl) tips.push('Add your LinkedIn URL for credibility.');
  if (!input.summary || input.summary.length < 100) {
    tips.push('Write a 2–4 sentence summary with role, years, and top skills.');
  }
  if (input.skills.length < 6) tips.push('List at least 6–10 job-relevant skills for ATS keyword match.');
  if (!input.experience.length) tips.push('Add at least one work experience with impact bullets.');
  const weakBullets = input.experience.some(
    (e) => !(e.bullets || []).some((b) => /\d|%|\$|led|built|improved|reduced|increased/i.test(b)),
  );
  if (input.experience.length && weakBullets) {
    tips.push('Use action + metric bullets (e.g. “Cut load time 40%”).');
  }
  if (!input.education.length) tips.push('Add education — degree and school.');
  if (!input.projects.length) tips.push('Add 1–2 projects to prove hands-on skill.');
  if (tips.length === 0) tips.push('Strong ATS profile — regenerate if you update details.');
  return tips.slice(0, 6);
}

/** Strengthen content for ATS; optionally prioritize skills/bullets toward a job description. */
export function optimizeInputForAts(
  input: ResumeBuilderInput,
  jobContext?: { jobTitle?: string; jobDescription?: string },
): ResumeBuilderInput {
  const jd = `${jobContext?.jobTitle || ''}\n${jobContext?.jobDescription || ''}`.trim();
  const jdLower = jd.toLowerCase();

  let skills = [...new Set(input.skills.map((s) => s.trim()).filter(Boolean))];
  if (jdLower) {
    const matched = skills.filter((s) => jdLower.includes(s.toLowerCase()));
    const rest = skills.filter((s) => !jdLower.includes(s.toLowerCase()));
    skills = [...matched, ...rest];
  }

  let summary = (input.summary || '').trim();
  if (summary.length < 80 && (input.title || skills.length)) {
    const yrs =
      typeof input.experienceYears === 'number' && input.experienceYears > 0
        ? `${input.experienceYears}+ years`
        : 'hands-on experience';
    const skillBit = skills.slice(0, 5).join(', ');
    summary = [
      `${input.displayName || 'Candidate'} is a ${input.title || 'professional'} with ${yrs}`,
      skillBit ? `across ${skillBit}` : '',
      'Focused on shipping reliable product outcomes and collaborating across teams.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  if (
    jd &&
    jobContext?.jobTitle &&
    summary &&
    !summary.toLowerCase().includes(jobContext.jobTitle.toLowerCase().slice(0, 24))
  ) {
    const roleHint = jobContext.jobTitle.trim();
    if (roleHint.length > 3 && roleHint.length < 80) {
      summary = `${summary} Targeting ${roleHint} responsibilities aligned with proven experience.`.slice(
        0,
        700,
      );
    }
  }

  const experience = input.experience.map((e) => {
    const bullets = (e.bullets || [])
      .map((b) => b.trim())
      .filter(Boolean)
      .map((b) => (/^[A-Z]/.test(b) ? b : b.charAt(0).toUpperCase() + b.slice(1)));
    if (!jdLower || bullets.length < 2) {
      return { ...e, bullets };
    }
    const roleWords = jdLower
      .split(/[^a-z0-9+#.]/i)
      .filter((w) => w.length >= 5)
      .slice(0, 40);
    const scored = bullets.map((b) => {
      const lower = b.toLowerCase();
      let score = 0;
      for (const skill of skills.slice(0, 20)) {
        if (skill.length >= 2 && lower.includes(skill.toLowerCase())) score += 2;
      }
      for (const w of roleWords) {
        if (lower.includes(w)) score += 1;
      }
      return { b, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return { ...e, bullets: scored.map((x) => x.b) };
  });

  let title = input.title;
  if (jobContext?.jobTitle?.trim() && (!title || title.length < 3)) {
    title = jobContext.jobTitle.trim();
  }

  return {
    ...input,
    title,
    skills,
    summary,
    experience,
  };
}

/** Professional multi-section HTML resume suitable for print / PDF. */
export function buildAdvancedResumeHtml(input: ResumeBuilderInput): {
  html: string;
  atsScore: number;
  fileName: string;
} {
  const template = input.template || 'modern';
  const accent =
    template === 'executive' ? '#0f172a' : template === 'classic' ? '#1e3a5f' : '#5b5ce2';
  const name = esc(input.displayName || 'Candidate');
  const title = esc(input.title || 'Professional');

  const experienceHtml = input.experience
    .map((e) => {
      const dates = [e.startDate, e.current ? 'Present' : e.endDate].filter(Boolean).join(' – ');
      const bullets = (e.bullets || [])
        .filter(Boolean)
        .map((b) => `<li>${esc(b)}</li>`)
        .join('');
      return `<section class="entry">
  <div class="entry-head">
    <div>
      <strong>${esc(e.title)}</strong>
      <div class="muted">${esc(e.company)}${e.location ? ` · ${esc(e.location)}` : ''}</div>
    </div>
    <div class="dates">${esc(dates)}</div>
  </div>
  ${bullets ? `<ul>${bullets}</ul>` : ''}
</section>`;
    })
    .join('\n');

  const educationHtml = input.education
    .map((e) => {
      const dates = [e.startDate, e.endDate].filter(Boolean).join(' – ');
      return `<section class="entry">
  <div class="entry-head">
    <div>
      <strong>${esc(e.degree)}${e.field ? ` in ${esc(e.field)}` : ''}</strong>
      <div class="muted">${esc(e.school)}</div>
      ${e.details ? `<div class="muted">${esc(e.details)}</div>` : ''}
    </div>
    <div class="dates">${esc(dates)}</div>
  </div>
</section>`;
    })
    .join('\n');

  const projectsHtml = input.projects
    .map((p) => {
      const bullets = (p.bullets || [])
        .filter(Boolean)
        .map((b) => `<li>${esc(b)}</li>`)
        .join('');
      return `<section class="entry">
  <strong>${esc(p.name)}</strong>${p.url ? ` · <a href="${esc(p.url)}">${esc(p.url)}</a>` : ''}
  ${p.tech ? `<div class="muted">${esc(p.tech)}</div>` : ''}
  <p>${esc(p.description)}</p>
  ${bullets ? `<ul>${bullets}</ul>` : ''}
</section>`;
    })
    .join('\n');

  const skills = input.skills.map((s) => `<span class="chip">${esc(s)}</span>`).join('');
  const certs = input.certifications.map((c) => `<li>${esc(c)}</li>`).join('');
  const langs = input.languages.map((l) => `<li>${esc(l)}</li>`).join('');
  const achievements = input.achievements.map((a) => `<li>${esc(a)}</li>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${name} — Resume</title>
<style>
  :root { --accent: ${accent}; --text: #0f172a; --muted: #64748b; --line: #e2e8f0; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    color: var(--text);
    margin: 0;
    background: #f8fafc;
  }
  .page {
    max-width: 820px;
    margin: 24px auto;
    background: #fff;
    padding: 40px 48px;
    box-shadow: 0 10px 40px rgba(15, 23, 42, 0.08);
  }
  header {
    border-bottom: 3px solid var(--accent);
    padding-bottom: 16px;
    margin-bottom: 22px;
  }
  h1 {
    margin: 0;
    font-size: 28px;
    letter-spacing: -0.03em;
    color: var(--accent);
  }
  .headline { margin: 4px 0 8px; font-size: 15px; font-weight: 600; color: #334155; }
  .contact { font-size: 12.5px; color: var(--muted); }
  h2 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--accent);
    margin: 22px 0 10px;
    border-bottom: 1px solid var(--line);
    padding-bottom: 4px;
  }
  .summary { font-size: 13.5px; line-height: 1.55; color: #334155; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip {
    background: color-mix(in srgb, var(--accent) 12%, white);
    color: var(--accent);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
  }
  .entry { margin-bottom: 12px; }
  .entry-head { display: flex; justify-content: space-between; gap: 12px; }
  .muted { color: var(--muted); font-size: 12.5px; margin-top: 2px; }
  .dates { font-size: 12px; color: var(--muted); white-space: nowrap; }
  ul { margin: 6px 0 0; padding-left: 18px; }
  li { font-size: 13px; line-height: 1.45; margin-bottom: 3px; }
  p { margin: 4px 0 0; font-size: 13px; line-height: 1.45; }
  a { color: var(--accent); text-decoration: none; font-size: 12px; }
  @media print {
    body { background: #fff; }
    .page { box-shadow: none; margin: 0; max-width: none; padding: 0; }
  }
</style>
</head>
<body>
  <article class="page">
    <header>
      <h1>${name}</h1>
      <div class="headline">${title}</div>
      <div class="contact">${contactLine(input)}</div>
    </header>

    ${
      input.summary
        ? `<h2>Professional Summary</h2><p class="summary">${esc(input.summary)}</p>`
        : ''
    }

    ${input.skills.length ? `<h2>Core Skills</h2><div class="chips">${skills}</div>` : ''}

    ${experienceHtml ? `<h2>Experience</h2>${experienceHtml}` : ''}

    ${educationHtml ? `<h2>Education</h2>${educationHtml}` : ''}

    ${projectsHtml ? `<h2>Projects</h2>${projectsHtml}` : ''}

    ${certs ? `<h2>Certifications</h2><ul>${certs}</ul>` : ''}

    ${langs ? `<h2>Languages</h2><ul>${langs}</ul>` : ''}

    ${achievements ? `<h2>Achievements</h2><ul>${achievements}</ul>` : ''}
  </article>
</body>
</html>`;

  const safeName = (input.displayName || 'resume')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return {
    html,
    atsScore: scoreAdvanced(input),
    fileName: `${safeName || 'resume'}-ats.html`,
  };
}

/** Build HTML for each template and keep the highest ATS score. */
export function buildBestAtsResume(
  input: ResumeBuilderInput,
  jobContext?: { jobTitle?: string; jobDescription?: string },
): {
  html: string;
  atsScore: number;
  fileName: string;
  template: 'classic' | 'modern' | 'executive';
  tips: string[];
  optimized: ResumeBuilderInput;
} {
  const optimized = optimizeInputForAts(input, jobContext);
  const templates: Array<'modern' | 'classic' | 'executive'> = ['modern', 'classic', 'executive'];
  let best = buildAdvancedResumeHtml({ ...optimized, template: 'modern' });
  let bestTemplate: 'classic' | 'modern' | 'executive' = 'modern';

  for (const template of templates) {
    const built = buildAdvancedResumeHtml({ ...optimized, template });
    if (built.atsScore >= best.atsScore) {
      best = built;
      bestTemplate = template;
    }
  }

  return {
    ...best,
    template: bestTemplate,
    tips: atsTips(optimized),
    optimized: { ...optimized, template: bestTemplate },
  };
}
