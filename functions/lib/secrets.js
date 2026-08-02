"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allSecrets = exports.fromEmail = exports.sendgridApiKey = exports.rapidApiKey = exports.openaiApiKey = void 0;
const params_1 = require("firebase-functions/params");
exports.openaiApiKey = (0, params_1.defineSecret)("OPENAI_API_KEY");
exports.rapidApiKey = (0, params_1.defineSecret)("RAPIDAPI_KEY");
exports.sendgridApiKey = (0, params_1.defineSecret)("SENDGRID_API_KEY");
exports.fromEmail = (0, params_1.defineSecret)("FROM_EMAIL");
exports.allSecrets = [exports.openaiApiKey, exports.rapidApiKey, exports.sendgridApiKey, exports.fromEmail];
//# sourceMappingURL=secrets.js.map