import { REST, Routes } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  console.error("Missing BOT_TOKEN or CLIENT_ID in environment variables");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("Clearing all global application (/) commands...");

    // Clear all global commands
    await rest.put(Routes.applicationCommands(clientId), {
      body: [],
    });

    console.log("Successfully cleared all global commands.");
    console.log("\nIf you have guild-specific commands, you need to clear them manually per guild:");
    console.log("rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })");
  } catch (error) {
    console.error("Error clearing commands:", error);
  }
})();
