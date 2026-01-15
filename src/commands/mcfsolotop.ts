import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "./Command";
import { Bot } from "../Bot";

export class McfSoloTopCommand extends Command {
  public readonly data = new SlashCommandBuilder()
    .setName("mcfsolotop")
    .setDescription("Get the top solo mcf players");

  constructor(bot: Bot) {
    super(bot);
  }

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      const embed = await this.generateMCFSoloTopEmbed();
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching MCF solo top players:", error);
      await interaction.editReply({
        content: "An error occurred while fetching the solo leaderboard. Please try again later.",
      });
    }
  }

  private async generateMCFSoloTopEmbed(): Promise<EmbedBuilder> {
    const statistics = await this.bot.statisticsDatabase.getMCFStatistics();

    interface TopPlayer {
      uuid: string;
      name: string;
      wins: number;
      kills: number;
      score: number;
    }

    const playerList: TopPlayer[] = [];

    statistics.forEach((week) => {
      if (week.players.length === 0) {
        return;
      }

      // Find the player with the highest individual score
      const sortedPlayers = [...week.players].sort((a, b) => b.score - a.score);
      const topPlayer = sortedPlayers[0];

      const existingPlayer = playerList.find((p) => p.uuid === topPlayer.uuid);
      if (existingPlayer) {
        existingPlayer.wins++;
        existingPlayer.kills += topPlayer.kills;
        existingPlayer.score += topPlayer.score;
      } else {
        playerList.push({
          kills: topPlayer.kills,
          score: topPlayer.score,
          uuid: topPlayer.uuid,
          wins: 1,
          name: "[UNKNOWN]",
        });
      }
    });

    playerList.sort((a, b) => {
      if (a.wins === b.wins) {
        return b.score - a.score;
      }
      return b.wins - a.wins;
    });

    const top10 = playerList.slice(0, 10);

    // Fetch usernames for top 10 players
    await Promise.all(
      top10.map(async (player) => {
        player.name = await this.bot.fetchUsername(player.uuid);
      })
    );

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("MCF Solo Leaderboard")
      .setAuthor({
        name: "NovaBOT",
        iconURL: "https://novauniverse.net/cdn/img/logos/logo.png",
      })
      .setThumbnail("https://novauniverse.net/cdn/img/logos/logo.png")
      .setDescription(
        "Here is a list of the top 10 solo mcf players. Note that placing top 1 solo does not guarantee a win since its the combined team score that determines who won each week. If you instead want to see top winners use `/mcftop` instead"
      )
      .setTimestamp();

    top10.forEach((player, index) => {
      if (player.wins === 0) {
        return;
      }

      const position = index + 1;
      const emoji = this.numberToEmoji(position);

      embed.addFields({
        name: `${emoji} ${player.name}`,
        value: `${player.name} has placed top 1 solo ${player.wins} times. Their total combined score is ${player.score} and has a total of ${player.kills} kills`,
      });
    });

    return embed;
  }

  private numberToEmoji(num: number): string {
    const emojiNumbers = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
    if (num >= 1 && num <= 10) {
      return emojiNumbers[num];
    }
    return num.toString();
  }
}
