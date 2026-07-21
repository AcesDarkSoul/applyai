import { defineSecret } from "firebase-functions/params";

export const openaiApiKey = defineSecret("OPENAI_API_KEY");
export const rapidApiKey = defineSecret("RAPIDAPI_KEY");
export const sendgridApiKey = defineSecret("SENDGRID_API_KEY");
export const fromEmail = defineSecret("FROM_EMAIL");

export const allSecrets = [openaiApiKey, rapidApiKey, sendgridApiKey, fromEmail];
