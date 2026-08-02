import type { Job, UserProfile } from '@/types';

export interface RecruiterContact {
  email: string;
  phone: string;
  name: string;
  isExtracted: boolean;
}

/**
 * Extract or generate realistic recruiter contact details (Email & Phone) from Job posting.
 * g30208493@gmail.com and 9999999999 are strictly reserved ONLY for the test sample job!
 */
export function extractRecruiterContact(job: Job): RecruiterContact {
  const isSampleTestJob =
    job.id === 'sample_recruiter_test_job' ||
    job.company.toLowerCase().includes('gaurav sahni');

  if (isSampleTestJob) {
    return {
      email: 'g30208493@gmail.com',
      phone: '9999999999',
      name: 'Gaurav Sahni (Hiring Manager)',
      isExtracted: true,
    };
  }

  const text = `${job.title} ${job.company} ${job.description} ${job.requirements.join(' ')}`;

  // 1. Extract Email from text
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);

  // 2. Extract Phone Number from text
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4})/i);

  // 3. Fallback corporate email generator based on specific job company domain
  const cleanCompany = job.company
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim() || 'company';

  const extractedEmail = emailMatch ? emailMatch[1] : `careers@${cleanCompany}.com`;
  const extractedPhone = phoneMatch ? phoneMatch[1] : '+91 98765 43210';
  const recruiterName = `Hiring Team at ${job.company}`;

  return {
    email: extractedEmail,
    phone: extractedPhone,
    name: recruiterName,
    isExtracted: !!emailMatch,
  };
}

/**
 * Build formal WhatsApp message text with Candidate Resume link
 */
export function buildFormalWhatsAppMessage(job: Job, profile?: Partial<UserProfile>): string {
  const candidateName = profile?.name || 'Candidate';
  const skills = profile?.skills?.slice(0, 3).join(', ') || 'Software Development';
  const resumeLink = profile?.resumeUrl || profile?.resumeFileName ? `Resume: ${profile?.resumeFileName || 'Saved in ApplyAI'}` : '';

  return (
    `Dear Hiring Manager at ${job.company},\n\n` +
    `I am writing to formally present my application for the ${job.title} position.\n\n` +
    `Key Skills: ${skills}\n` +
    (profile?.experience !== undefined ? `Experience: ${profile.experience} years\n` : '') +
    (resumeLink ? `${resumeLink}\n` : '') +
    `\nThank you for considering my application.\n\n` +
    `Sincerely,\n${candidateName}\n` +
    (profile?.phone ? `Contact: ${profile.phone}` : '')
  );
}

/**
 * Build formal email subject & body text with Candidate Resume link
 */
export function buildFormalEmailPayload(job: Job, profile?: Partial<UserProfile>): { subject: string; body: string } {
  const candidateName = profile?.name || 'Candidate';
  const skills = profile?.skills?.slice(0, 4).join(', ') || 'Software Development';

  const subject = `Application for ${job.title} - ${candidateName}`;
  const body =
    `Dear Hiring Team at ${job.company},\n\n` +
    `I hope this email finds you well.\n\n` +
    `I am writing to formally submit my application for the ${job.title} opportunity at ${job.company}.\n\n` +
    `With a strong technical foundation in ${skills}, I am confident in my ability to deliver immediate value to your engineering team.\n\n` +
    `Candidate Profile Summary:\n` +
    `• Name: ${candidateName}\n` +
    `• Phone: ${profile?.phone || 'Not provided'}\n` +
    `• Experience: ${profile?.experience || 0} years\n` +
    `• Key Skills: ${skills}\n` +
    (profile?.linkedin ? `• LinkedIn: ${profile.linkedin}\n` : '') +
    `\nPlease find my resume details attached for your review.\n\n` +
    `Thank you for your time and consideration.\n\n` +
    `Best regards,\n${candidateName}`;

  return { subject, body };
}
