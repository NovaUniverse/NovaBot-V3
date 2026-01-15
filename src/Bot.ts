import { Client, GatewayIntentBits, Partials } from "discord.js";
import { Config } from "./config/Config";
import { initializeCommands } from "./commands";
import { Command } from "./commands/Command";
import { StatisticsDB } from "./database/StatisticsDB";
import { Quotes } from "./Quotes";

export class Bot {
  public readonly config: Config;
  public readonly client: Client;
  public readonly commands: Map<string, Command>;
  public readonly statisticsDatabase: StatisticsDB;

  constructor(config: Config) {
    this.config = config;

    this.statisticsDatabase = new StatisticsDB(this);

    // Initialize Discord client with intents and partials
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [Partials.Channel, Partials.Message, Partials.User],
    });

    // Initialize commands with bot reference
    this.commands = initializeCommands(this);

    this.setupEventHandlers();
    this.login();
  }

  private setupEventHandlers() {
    // Ready event
    this.client.once("ready", () => {
      console.log(`Logged in as ${this.client.user?.tag}!`);
      console.log(`Bot is ready and serving ${this.client.guilds.cache.size} guilds`);

      // Set bot activity
      this.client.user?.setActivity("novauniverse.net", { type: 0 }); // type 0 = Playing
    });

    // Interaction handler for slash commands
    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      console.log(`Command received: ${interaction.commandName} from ${interaction.user.tag}`);

      const command = this.commands.get(interaction.commandName);

      if (!command) {
        console.warn(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);

        const errorMessage = {
          content: "There was an error while executing this command!",
          ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    });

    // Error handling
    this.client.on("error", (error) => {
      console.error("Discord client error:", error);
    });

    // Warn handler
    this.client.on("warn", (warning) => {
      console.warn("Discord client warning:", warning);
    });

    // DM handler - respond with random quote
    this.client.on("messageCreate", async (message) => {
      // Ignore messages from bots and messages in guilds (only respond to DMs)
      if (message.author.bot || message.guild) return;

      try {
        const randomQuote = Quotes[Math.floor(Math.random() * Quotes.length)];
        await message.channel.send(randomQuote);
        console.log(`Sent random quote to ${message.author.tag} via DM`);
      } catch (error) {
        console.error(`Error responding to DM from ${message.author.tag}:`, error);
      }
    });
  }

  private async login() {
    try {
      await this.client.login(this.config.botToken);
    } catch (error) {
      console.error("Failed to login to Discord:", error);
      process.exit(1);
    }
  }

  public getClient(): Client {
    return this.client;
  }

  public async fetchUsername(uuid: string): Promise<string> {
    try {
      const response = await fetch(`https://playerdb.co/api/player/minecraft/${uuid}`);
      if (!response.ok) {
        return "[UNKNOWN]";
      }
      const data = await response.json();
      if (data.success && data.data?.player?.username) {
        return data.data.player.username;
      }
      return "[UNKNOWN]";
    } catch (error) {
      console.error(`Error fetching username for UUID ${uuid}:`, error);
      return "[UNKNOWN]";
    }
  }

  public async shutdown() {
    console.log("Shutting down bot...");
    this.client.destroy();
  }
}
