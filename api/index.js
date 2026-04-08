// Import from the pre-built esbuild output (pure JS, no TypeScript)
// This avoids all Vercel TypeScript compilation conflicts
import app from "../artifacts/api-server/dist/app.mjs";

console.log("Vercel Serverless Function Booting Up with dynamic dist dependency...");

export default app;
