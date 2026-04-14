"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assistantImageFlowCallable = exports.assistantFlowCallable = void 0;
const https_1 = require("firebase-functions/https");
const params_1 = require("firebase-functions/params");
const assistant_flow_1 = require("./flows/assistant-flow");
const assistant_image_flow_1 = require("./flows/assistant-image-flow");
const geminiApiKey = (0, params_1.defineSecret)('GEMINI_API_KEY');
exports.assistantFlowCallable = (0, https_1.onCallGenkit)({
    secrets: [geminiApiKey],
}, assistant_flow_1.assistantFlow);
exports.assistantImageFlowCallable = (0, https_1.onCallGenkit)({
    secrets: [geminiApiKey],
}, assistant_image_flow_1.assistantImageFlow);
//# sourceMappingURL=index.js.map