import dotenv from "dotenv";

dotenv.config();

// const requiredEnvVars = ["DATABASE_URL", "DIRECT_URL"];
// I did not make DIRECT_URL required here because the running server does not directly need it. Prisma migrations need it.

const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET_KEY"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  directUrl: process.env.DIRECT_URL,
   jwtSecret: process.env.JWT_SECRET_KEY,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  appName: process.env.APP_NAME || "App",
};