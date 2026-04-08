// @ts-nocheck
// Import from pre-built esbuild output to avoid Vercel's own TS compilation
// conflicting with Express types (Request/Response vs global Fetch API types).
import app from "../artifacts/api-server/src/app";
export default app;
