"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.curriculoParserCallable = exports.viagemPlanningCallable = exports.carreiraAnaliseCallable = exports.financasInsightsCallable = exports.extratoParserCallable = exports.faturaParserCallable = exports.assistantImageFlowCallable = exports.assistantFlowCallable = void 0;
const https_1 = require("firebase-functions/https");
const params_1 = require("firebase-functions/params");
const assistant_flow_1 = require("./flows/assistant-flow");
const assistant_image_flow_1 = require("./flows/assistant-image-flow");
const fatura_parser_flow_1 = require("./flows/fatura-parser-flow");
const extrato_parser_flow_1 = require("./flows/extrato-parser-flow");
const insights_flow_1 = require("./flows/insights-flow");
const carreira_flow_1 = require("./flows/carreira-flow");
const viagem_planning_flow_1 = require("./flows/viagem-planning-flow");
const curriculo_parser_flow_1 = require("./flows/curriculo-parser-flow");
const geminiApiKey = (0, params_1.defineSecret)('GEMINI_API_KEY');
exports.assistantFlowCallable = (0, https_1.onCallGenkit)({
    secrets: [geminiApiKey],
}, assistant_flow_1.assistantFlow);
exports.assistantImageFlowCallable = (0, https_1.onCallGenkit)({
    secrets: [geminiApiKey],
}, assistant_image_flow_1.assistantImageFlow);
exports.faturaParserCallable = (0, https_1.onCallGenkit)({
    secrets: [geminiApiKey],
    timeoutSeconds: 300,
    memory: '512MiB',
}, fatura_parser_flow_1.faturaParserFlow);
exports.extratoParserCallable = (0, https_1.onCallGenkit)({
    secrets: [geminiApiKey],
    timeoutSeconds: 300,
    memory: '512MiB',
}, extrato_parser_flow_1.extratoParserFlow);
exports.financasInsightsCallable = (0, https_1.onCallGenkit)({
    secrets: [geminiApiKey],
}, insights_flow_1.insightsFlow);
exports.carreiraAnaliseCallable = (0, https_1.onCallGenkit)({
    secrets: [geminiApiKey],
    timeoutSeconds: 180,
    memory: '512MiB',
}, carreira_flow_1.carreiraFlow);
exports.viagemPlanningCallable = (0, https_1.onCallGenkit)({
    secrets: [geminiApiKey],
    timeoutSeconds: 300,
    memory: '512MiB',
    cors: true,
}, viagem_planning_flow_1.viagemPlanningFlow);
exports.curriculoParserCallable = (0, https_1.onCallGenkit)({
    secrets: [geminiApiKey],
    timeoutSeconds: 180,
    memory: '512MiB',
    cors: true,
}, curriculo_parser_flow_1.curriculoParserFlow);
//# sourceMappingURL=index.js.map