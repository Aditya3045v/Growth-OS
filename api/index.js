// Import from pre-built esbuild output via the source file (transpiled at runtime by Vercel)
// We use .js to avoid Vercel's independent TypeScript pass which conflicts with Express types
import app from "../artifacts/api-server/src/app.ts";
export default app;
