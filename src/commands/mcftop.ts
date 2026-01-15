import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "./Command";
import { Bot } from "../Bot";

export class McfTopCommand extends Command {
  public readonly data = new SlashCommandBuilder()
    .setName("mcftop")
    .setDescription("Get the top mcf players");

  constructor(bot: Bot) {
    super(bot);
  }

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      const embed = await this.generateMCFTopEmbed();
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching MCF top players:", error);
      await interaction.editReply({
        content: "An error occurred while fetching the leaderboard. Please try again later.",
      });
    }
  }

  private async generateMCFTopEmbed(): Promise<EmbedBuilder> {
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
      if (week.players.length === 0 || week.teams.length === 0) {
        return;
      }

      week.teams.sort((a, b) => b.team_score - a.team_score);
      const winningTeam = week.teams[0];

      const teamPlayers = week.players.filter(
        (p) => p.team_number === winningTeam.team_number
      );
      teamPlayers.sort((a, b) => b.score - a.score);

      teamPlayers.forEach((winner) => {
        const existingPlayer = playerList.find((p) => p.uuid === winner.uuid);
        if (existingPlayer) {
          existingPlayer.wins++;
          existingPlayer.kills += winner.kills;
          existingPlayer.score += winner.score;
        } else {
          playerList.push({
            kills: winner.kills,
            score: winner.score,
            uuid: winner.uuid,
            wins: 1,
            name: "[UNKNOWN]",
          });
        }
      });
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
      .setTitle("MCF Leaderboard")
      .setAuthor({
        name: "NovaBOT",
        iconURL: "https://novauniverse.net/cdn/img/logos/logo.png",
      })
      .setThumbnail("https://novauniverse.net/cdn/img/logos/logo.png")
      .setDescription("Here is a list of the top 10 mcf players")
      .setTimestamp();

    top10.forEach((player, index) => {
      if (player.wins === 0) {
        return;
      }

      const position = index + 1;
      const emoji = this.numberToEmoji(position);

      embed.addFields({
        name: `${emoji} ${player.name}`,
        value: `${player.name} has a total of ${player.wins} wins. Their total combined score is ${player.score} and has a total of ${player.kills} kills`,
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
