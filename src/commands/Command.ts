import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";
import { Bot } from "../Bot";

export abstract class Command {
  protected readonly bot: Bot;
  public abstract readonly data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;

  constructor(bot: Bot) {
    this.bot = bot;
  }

  public abstract execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
