"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDb = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const adminApp = (0, app_1.getApps)().length > 0
    ? (0, app_1.getApps)()[0]
    : (0, app_1.initializeApp)({
        credential: (0, app_1.applicationDefault)(),
    });
exports.adminDb = (0, firestore_1.getFirestore)(adminApp);
//# sourceMappingURL=firebase-admin.js.map