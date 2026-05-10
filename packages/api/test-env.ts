import "dotenv/config";
console.log("Checking environment variables in packages/api:");
console.log("GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY);
console.log("ANTHROPIC_API_KEY exists:", !!process.env.ANTHROPIC_API_KEY);
console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
console.log("LLM_DEFAULT_PROVIDER:", process.env.LLM_DEFAULT_PROVIDER);
