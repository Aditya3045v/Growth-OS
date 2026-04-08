// Import from the pre-built esbuild output (pure JS, no TypeScript)
// This avoids all Vercel TypeScript compilation conflicts
const app = require("../artifacts/api-server/dist/app.cjs").default;

console.log("Vercel Serverless Function Booting Up with CJS dist dependency...");

module.exports = app;
