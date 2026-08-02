"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSocialPost = exports.sendOutreachEmail = exports.generateCoverLetter = exports.getRecommendedJobs = exports.searchJobs = exports.parseResume = exports.db = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
exports.db = (0, firestore_1.getFirestore)();
var resume_1 = require("./resume");
Object.defineProperty(exports, "parseResume", { enumerable: true, get: function () { return resume_1.parseResume; } });
var jobs_1 = require("./jobs");
Object.defineProperty(exports, "searchJobs", { enumerable: true, get: function () { return jobs_1.searchJobs; } });
Object.defineProperty(exports, "getRecommendedJobs", { enumerable: true, get: function () { return jobs_1.getRecommendedJobs; } });
var coverLetter_1 = require("./coverLetter");
Object.defineProperty(exports, "generateCoverLetter", { enumerable: true, get: function () { return coverLetter_1.generateCoverLetter; } });
var email_1 = require("./email");
Object.defineProperty(exports, "sendOutreachEmail", { enumerable: true, get: function () { return email_1.sendOutreachEmail; } });
var socialPost_1 = require("./socialPost");
Object.defineProperty(exports, "generateSocialPost", { enumerable: true, get: function () { return socialPost_1.generateSocialPost; } });
//# sourceMappingURL=index.js.map