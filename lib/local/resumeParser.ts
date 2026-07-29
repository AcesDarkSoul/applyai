/**
 * Client-Side Smart Resume Text & Pattern Parser
 * Extracts real candidate name, email, phone, linkedin, github, skills, experience, and education
 * directly from base64 / text content.
 */

export interface ParsedResumeResult {
  name: string;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  github: string | null;
  skills: string[];
  experience: number;
  education: Array<{ institution: string; degree: string; field: string; startYear: number; endYear?: number }>;
  preferredLocation: string;
  summary: string;
  atsScore: number;
  hasResume: boolean;
  resumeFileName: string;
}

const SKILL_DICTIONARY = [
  // Programming Languages & Frameworks
  'React Native', 'React', 'TypeScript', 'JavaScript', 'Node.js', 'Express',
  'Python', 'Django', 'FastAPI', 'Flask', 'Java', 'Spring Boot', 'C++', 'C#', '.NET',
  'Swift', 'SwiftUI', 'Kotlin', 'Android', 'Flutter', 'Dart', 'Go', 'Rust', 'Ruby', 'Rails', 'PHP', 'Laravel',
  'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'GraphQL', 'REST APIs', 'Cassandra', 'Elasticsearch',
  // Cloud, DevOps & Systems
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Git', 'Linux', 'System Design', 'Microservices',
  'Redux', 'Zustand', 'Tailwind CSS', 'HTML5', 'CSS3', 'Next.js', 'Vue.js', 'Angular', 'Vite', 'Webpack', 'Jest',
  // Data Science, AI & Machine Learning
  'Machine Learning', 'Data Science', 'PyTorch', 'TensorFlow', 'OpenAI', 'Deep Learning', 'NLP', 'Computer Vision',
  'Pandas', 'NumPy', 'Scikit-Learn', 'R', 'Data Analysis', 'Tableau', 'Power BI', 'BigQuery', 'Spark',
  // Product, Design & Business
  'Figma', 'UI/UX Design', 'Product Management', 'Agile', 'Scrum', 'Jira', 'Project Management',
  'Digital Marketing', 'SEO', 'Content Strategy', 'Financial Analysis', 'Accounting', 'Sales', 'Business Development',
  'Cybersecurity', 'Network Security', 'Quality Assurance', 'Automation Testing', 'Selenium'
];

/** Decode base64 to readable text strings, handling binary PDF stream tokens */
function decodeBase64ToText(base64: string): string {
  try {
    const raw = atob(base64);
    // Replace non-printable control characters with spaces
    let text = raw.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
    // If text is binary PDF content, extract ASCII word sequences
    if (text.includes('%PDF') || text.length < 50) {
      const asciiWords = raw.match(/[a-zA-Z0-9.+@#/\\-]{2,}/g) || [];
      text = asciiWords.join(' ');
    }
    return text;
  } catch {
    return base64;
  }
}

export function parseResumeContent(base64Content: string, fileName: string): ParsedResumeResult {
  const text = decodeBase64ToText(base64Content);
  const textLower = text.toLowerCase();

  // 1. Extract Email
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = text.match(emailRegex);
  const email = emailMatch ? emailMatch[1].trim() : null;

  // 2. Extract Phone Number
  const phoneRegex = /(\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4})/i;
  const phoneMatch = text.match(phoneRegex);
  const phone = phoneMatch && phoneMatch[1].length >= 10 ? phoneMatch[1].trim() : null;

  // 3. Extract LinkedIn URL
  const linkedinRegex = /(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/i;
  const linkedinMatch = text.match(linkedinRegex);
  const linkedin = linkedinMatch ? `https://www.${linkedinMatch[1]}` : null;

  // 4. Extract GitHub URL
  const githubRegex = /(github\.com\/[a-zA-Z0-9_-]+)/i;
  const githubMatch = text.match(githubRegex);
  const github = githubMatch ? `https://${githubMatch[1]}` : null;

  // 5. Extract Candidate Name
  let name = '';

  // Try extracting from email prefix first (e.g. john.doe@gmail.com -> John Doe)
  if (email) {
    const prefix = email.split('@')[0];
    const parts = prefix.split(/[._-]/).filter((p) => p.length > 1 && !/\d/.test(p));
    if (parts.length >= 1) {
      name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
    }
  }

  // Fallback to cleaning filename if name from email is inadequate
  if (!name || name.length < 3) {
    const cleanName = fileName
      .replace(/\.(pdf|docx)$/i, '')
      .replace(/(resume|cv|profile|_|-|draft|final|\d+)/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanName.length > 2) {
      name = cleanName
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    } else {
      name = 'Candidate';
    }
  }

  // 6. Extract Technical & Professional Skills
  const extractedSkills: string[] = [];
  SKILL_DICTIONARY.forEach((skill) => {
    const sLower = skill.toLowerCase();
    const safeRegex = new RegExp(`\\b${sLower.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (safeRegex.test(textLower)) {
      extractedSkills.push(skill);
    }
  });

  // DO NOT inject fake skills if 0 detected. Preserve real candidate skills or empty list.
  const finalSkills = extractedSkills;

  // 7. Extract Years of Experience
  let experience = 0;
  const expMatch = textLower.match(/(\d+)\+?\s*(years?|yrs?)\s*(of)?\s*(experience|exp)/i);
  if (expMatch && expMatch[1]) {
    const parsedExp = parseInt(expMatch[1], 10);
    if (!isNaN(parsedExp) && parsedExp >= 0 && parsedExp <= 30) {
      experience = parsedExp;
    }
  }

  // If experience phrase not explicitly found, estimate from date ranges (e.g. 2020-2024 -> 4 yrs)
  if (experience === 0) {
    const yearMatches = text.match(/\b(20[0-2][0-9]|19[8-9][0-9])\b/g);
    if (yearMatches && yearMatches.length >= 2) {
      const years = yearMatches.map((y) => parseInt(y, 10)).sort((a, b) => a - b);
      const minYear = years[0];
      const maxYear = years[years.length - 1];
      const diff = maxYear - minYear;
      if (diff > 0 && diff <= 30) {
        experience = diff;
      }
    }
  }

  // 8. Extract Education Degree (ZERO assumptions: leave fields empty if not explicitly stated)
  const education: ParsedResumeResult['education'] = [];
  if (textLower.includes('b.tech') || textLower.includes('btech')) {
    education.push({ institution: '', degree: 'Bachelor of Technology (B.Tech)', field: '', startYear: 0 });
  } else if (textLower.includes('b.e') || textLower.includes('bachelor')) {
    education.push({ institution: '', degree: 'Bachelor Degree', field: '', startYear: 0 });
  } else if (textLower.includes('m.tech') || textLower.includes('m.s') || textLower.includes('master') || textLower.includes('mba')) {
    education.push({ institution: '', degree: 'Master Degree', field: '', startYear: 0 });
  }

  // Calculate ATS Optimization Score based strictly on real presence of skills and contact details
  const atsScore = Math.min(95, Math.max(40, 40 + finalSkills.length * 5 + (email ? 15 : 0) + (phone ? 15 : 0) + (linkedin ? 10 : 0)));

  return {
    name,
    email,
    phone,
    linkedin,
    github,
    skills: finalSkills,
    experience,
    education,
    preferredLocation: '',
    summary: '',
    atsScore,
    hasResume: true,
    resumeFileName: fileName,
  };
}
