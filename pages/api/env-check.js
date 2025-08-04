export default async function handler(req, res) {
  return res.status(200).json({
    SUPABASE_URL: process.env.SUPABASE_URL ? "OK ✅" : "Missing ❌",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set ✅" : "Missing ❌",
    SMTP_HOST: process.env.SMTP_HOST ? "OK ✅" : "Missing ❌",
    SMTP_PORT: process.env.SMTP_PORT ? "OK ✅" : "Missing ❌",
    SMTP_USER: process.env.SMTP_USER ? "OK ✅" : "Missing ❌",
    SMTP_PASS: process.env.SMTP_PASS ? "Set ✅" : "Missing ❌",
    SMTP_SECURE: process.env.SMTP_SECURE ? "OK ✅" : "Missing ❌",
    MAIL_FROM: process.env.MAIL_FROM ? "OK ✅" : "Missing ❌",
    JWT_SECRET: process.env.JWT_SECRET ? "Set ✅" : "Missing ❌",
    NODE_ENV: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    serverInfo: {
      platform: process.platform,
      nodeVersion: process.version,
      environment: process.env.VERCEL ? "Vercel" : "Local"
    }
  });
}
