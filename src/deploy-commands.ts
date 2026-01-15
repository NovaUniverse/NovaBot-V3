import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import { getCommandsData } from "./commands";

dotenv.config();

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  console.error("Missing BOT_TOKEN or CLIENT_ID in environment variables");
  process.exit(1);
}

const commandsData = getCommandsData();

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log(`Started refreshing ${commandsData.length} application (/) commands.`);

    // Deploy global commands (this replaces all existing global commands)
    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commandsData,
    }) as any[];

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    console.log(`Registered commands: ${data.map((cmd: any) => cmd.name).join(", ")}`);
  } catch (error) {
    console.error("Error deploying commands:", error);
  }
})();
