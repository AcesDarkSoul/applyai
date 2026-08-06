#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  detectPlatform,
  extractContacts,
  processJobs,
  scoreJob,
  buildEmail,
  buildSms,
} from "../lib/outreach.mjs";
import { parseResumeHeuristic, toCandidateConfig } from "../lib/resumeParse.mjs";

const linkedinJob = {
  job_id: "1",
  job_title: "React Developer",
  employer_name: "Acme",
  job_publisher: "LinkedIn",
  job_apply_link: "https://www.linkedin.com/jobs/view/123",
  job_description:
    "Need React and TypeScript. Email careers@acme.dev or call +91 98765 43210",
  job_required_skills: ["React", "TypeScript"],
  job_is_remote: true,
  job_city: "Bengaluru",
  job_country: "IN",
};

assert.equal(detectPlatform(linkedinJob), "linkedin");
assert.equal(scoreJob(linkedinJob, ["React", "TypeScript", "Go"]), 72);
const contacts = extractContacts(linkedinJob.job_description);
assert.equal(contacts.contactEmail, "careers@acme.dev");
assert.ok(contacts.contactPhone);

const profile = {
  candidate: {
    name: "Sagar",
    email: "sagar@test.com",
    phone: "+910000000000",
    skills: ["React", "TypeScript"],
    resumeUrl: "https://example.com/r.pdf",
  },
  limits: { minMatchScore: 40, dailyEmail: 10, dailySms: 5 },
  flags: { dryRun: true, platforms: ["linkedin"] },
};

const matched = processJobs([linkedinJob], profile);
assert.equal(matched.length, 1);
assert.equal(matched[0].channel, "email");
assert.equal(matched[0].platform, "linkedin");
assert.ok(matched[0].smartApplyUrl.includes("linkedin.com"));

const mail = buildEmail(matched[0]);
assert.ok(mail.subject.includes("React Developer"));
assert.equal(mail.to, "careers@acme.dev");

const smsJob = {
  ...linkedinJob,
  job_id: "2",
  job_description: "Call HR at +919876543210 for React roles",
};
const smsMatched = processJobs([smsJob], profile);
assert.equal(smsMatched[0].channel, "sms");
const sms = buildSms(smsMatched[0]);
assert.ok(sms.message.includes("React Developer"));

const noContact = processJobs(
  [
    {
      ...linkedinJob,
      job_id: "3",
      job_description: "Apply on LinkedIn only. Need React.",
    },
  ],
  profile
);
assert.equal(noContact[0].channel, "platform_only");

const sampleResume = `Sagar Patil
sagar@test.com
+91 99999 88888
Full Stack Developer with 3 years of experience
Skills: React, TypeScript, Node.js, Firebase, Docker`;
const heur = parseResumeHeuristic(sampleResume);
assert.equal(heur.email, "sagar@test.com");
assert.ok(heur.skills.includes("React"));
const cfg = toCandidateConfig({ ...heur, sourceFile: "sample.txt" });
assert.ok(cfg.searchQueries[0].includes("Full Stack"));

console.log("self-test OK — match, extract, email/sms/smart-apply + resume parse verified");
