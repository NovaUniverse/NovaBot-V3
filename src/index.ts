import dotenv from "dotenv";
import consoleStamp from "console-stamp";
import { Config } from "./config/Config";
import { Bot } from "./Bot";

dotenv.config();
consoleStamp(console);

const botToken = process.env.BOT_TOKEN ?? "";

const statisticsDbHostname = process.env.STATISTICS_DB_HOSTNAME ?? "";
const statisticsDbPort = process.env.STATISTICS_DB_PORT
  ? parseInt(process.env.STATISTICS_DB_PORT)
  : 3306;
const statisticsDbUsername = process.env.STATISTICS_DB_USERNAME ?? "";
const statisticsDbPassword = process.env.STATISTICS_DB_PASSWORD ?? "";
const statisticsDbDatabase = process.env.STATISTICS_DB_DATABASE ?? "";

const config: Config = {
  botToken: botToken,
  statisticsDatabase: {
    hostname: statisticsDbHostname,
    port: statisticsDbPort,
    username: statisticsDbUsername,
    password: statisticsDbPassword,
    database: statisticsDbDatabase,
  },
};

console.log("Bot is starting...");
const bot = new Bot(config);

// Graceful shutdown handlers
process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT, shutting down gracefully...");
  await bot.shutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM, shutting down gracefully...");
  await bot.shutdown();
  process.exit(0);
});
