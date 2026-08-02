import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
export const db = getFirestore();

export { parseResume } from "./resume";
export { searchJobs, getRecommendedJobs } from "./jobs";
export { generateCoverLetter } from "./coverLetter";
export { sendOutreachEmail } from "./email";
export { generateSocialPost } from "./socialPost";
