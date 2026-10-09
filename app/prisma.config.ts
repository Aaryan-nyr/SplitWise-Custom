import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations", // defines the schema location
    seed: "node prisma/seed.mjs" // executes seed command from where the mock data is from 
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
