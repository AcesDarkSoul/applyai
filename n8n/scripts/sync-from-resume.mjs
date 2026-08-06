#!/usr/bin/env node
/**
 * Parse a resume PDF/TXT and fill n8n candidate profile (.env + config/candidate.json).
 *
 * Usage:
 *   npm run sync:resume -- "D:\path\to\resume.pdf"
 *   npm run sync:resume -- .\config\resumes\resume.pdf
 *
 * Or set RESUME_PATH in .env / drop file in config/resumes/
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseResumeFile,
  toCandidateConfig,
  upsertEnvCandidate,
} from "../lib/resumeParse.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");
const candidatePath = path.join(root, "config", "candidate.json");
const resumeDropDir = path.join(root, "config", "resumes");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function findResumePath(cliArg) {
  if (cliArg) return path.resolve(cliArg);
  if (process.env.RESUME_PATH) return path.resolve(process.env.RESUME_PATH);

  if (fs.existsSync(resumeDropDir)) {
    const files = fs
      .readdirSync(resumeDropDir)
      .filter((f) => /\.(pdf|txt|md)$/i.test(f))
      .sort();
    if (files.length) return path.join(resumeDropDir, files[0]);
  }
  return null;
}

async function main() {
  loadEnvFile(envPath);
  fs.mkdirSync(resumeDropDir, { recursive: true });

  const resumePath = findResumePath(process.argv[2]);
  if (!resumePath) {
    console.error(`No resume found.

Put your resume here:
  ${resumeDropDir}\\your-resume.pdf

Or run:
  npm run sync:resume -- "D:\\full\\path\\resume.pdf"
`);
    process.exit(1);
  }

  console.log("Parsing resume:", resumePath);
  const openaiKey = process.env.OPENAI_API_KEY || "";
  const parsed = await parseResumeFile(resumePath, {
    openaiKey: openaiKey && openaiKey !== "your_openai_key" ? openaiKey : "",
  });

  const candidate = toCandidateConfig(parsed, {
    resumeUrl: process.env.CANDIDATE_RESUME_URL || "",
  });

  fs.mkdirSync(path.dirname(candidatePath), { recursive: true });
  fs.writeFileSync(candidatePath, JSON.stringify(candidate, null, 2));

  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(path.join(root, ".env.example"), envPath);
  }
  const envText = fs.readFileSync(envPath, "utf8");
  fs.writeFileSync(envPath, upsertEnvCandidate(envText, candidate));

  // Copy resume into drop folder for reference (if not already there)
  const destCopy = path.join(resumeDropDir, path.basename(resumePath));
  if (path.resolve(resumePath) !== path.resolve(destCopy)) {
    fs.copyFileSync(resumePath, destCopy);
  }

  console.log("\n=== Extracted candidate ===");
  console.log(
    JSON.stringify(
      {
        parseMethod: candidate.parseMethod,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        title: candidate.title,
        location: candidate.location,
        yearsExperience: candidate.yearsExperience,
        skills: candidate.skills,
        searchQuery: candidate.searchQueries?.[0],
      },
      null,
      2
    )
  );
  console.log(`\nWrote: ${candidatePath}`);
  console.log(`Updated: ${envPath}`);
  console.log("\nNext: npm run outreach");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
