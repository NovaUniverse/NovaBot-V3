import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "./Command";
import { Bot } from "../Bot";

export class McfStatsCommand extends Command {
  public readonly data = new SlashCommandBuilder()
    .setName("mcfstats")
    .setDescription("Check the MCF stats of a user by their username")
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("The username of the minecraft player to check")
        .setRequired(true)
    );

  constructor(bot: Bot) {
    super(bot);
  }

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const username = interaction.options.getString("username", true);

    await interaction.deferReply();

    try {
      const embed = await this.generateMCFStatsEmbed(username);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error fetching MCF stats for ${username}:`, error);
      await interaction.editReply({
        content: "An error occurred while fetching MCF stats. Please try again later.",
      });
    }
  }

  private async generateMCFStatsEmbed(username: string): Promise<EmbedBuilder> {
    const MAX_ROWS = 10;
    const statistics = await this.bot.statisticsDatabase.getMCFStatistics();

    // Find player by username (case-insensitive search)
    let playerUuid: string | null = null;
    let actualUsername: string = username;

    for (const week of statistics) {
      const player = week.players.find(
        (p) => p.username.toLowerCase() === username.toLowerCase()
      );
      if (player) {
        playerUuid = player.uuid;
        actualUsername = player.username;
        break;
      }
    }

    if (!playerUuid) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Player Not Found")
        .setDescription(`Could not find MCF stats for player "${username}". Make sure the username is correct and they have played in at least one MCF tournament.`)
        .setTimestamp();
      return embed;
    }

    interface WeekResult {
      won: boolean;
      name: string;
      kills: number;
      score: number;
      placement: string;
      teamPlayers: string[];
      teamPlacement: number;
    }

    const weeks: WeekResult[] = [];
    let totalScore = 0;
    let totalKills = 0;

    statistics.forEach((week) => {
      const player = week.players.find((p) => p.uuid === playerUuid);

      if (player) {
        // Sort players by score to determine individual placement
        const sortedPlayers = [...week.players].sort((a, b) => b.score - a.score);
        const place = sortedPlayers.findIndex((p) => p.uuid === playerUuid) + 1;

        // Sort teams by score to determine team placement
        const sortedTeams = [...week.teams].sort((a, b) => b.team_score - a.team_score);
        const teamPlacement = sortedTeams.findIndex((t) => t.team_number === player.team_number) + 1;

        // Check if player's team won (team placement 1)
        const isWin = teamPlacement === 1;

        totalScore += player.score;
        totalKills += player.kills;

        // Get teammates
        const teamPlayers = week.players
          .filter((p) => p.team_number === player.team_number && p.uuid !== playerUuid)
          .map((p) => p.username);

        weeks.push({
          won: isWin,
          name: week.display_name,
          kills: player.kills,
          score: player.score,
          placement: this.ordinalSuffixOf(place) + " place",
          teamPlayers: teamPlayers,
          teamPlacement: teamPlacement,
        });
      }
    });

    let extraDescription = "";
    const wins = weeks.filter((w) => w.won).length;

    if (weeks.length > 0) {
      extraDescription += `, has ${wins} win${wins === 1 ? "" : "s"} and a total of ${totalKills} kills. The combined score of all their weeks is ${totalScore}`;
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`${actualUsername}'s MCF stats:`)
      .setAuthor({
        name: "NovaBOT",
        iconURL: "https://novauniverse.net/cdn/img/logos/logo.png",
      })
      .setThumbnail(`https://mc-heads.net/avatar/${playerUuid}`)
      .setDescription(
        `${actualUsername} has played in ${weeks.length} tournament${weeks.length === 1 ? "" : "s"}${extraDescription}`
      )
      .setTimestamp();

    weeks.reverse();

    embed.addFields({
      name: "Results",
      value: `Here is a list of the last tournaments they played in. Note that this is limited to ${MAX_ROWS} rows due to discord limitations, [Click here for full stats](https://novauniverse.net/mcf_stats/?uuid=${playerUuid})`,
    });

    let lines = 0;
    let removedLines = 0;

    weeks.forEach((r) => {
      if (lines >= MAX_ROWS) {
        removedLines++;
        return;
      }
      lines++;

      let summary = "";
      summary += r.won
        ? ":crown: Team won"
        : `:x: Team lost at ${this.ordinalSuffixOf(r.teamPlacement)} place`;
      summary += `. ${actualUsername} got ${r.placement} with ${r.score} points and ${r.kills} kills`;

      if (r.teamPlayers.length > 0) {
        summary += `. They played with ${this.makeString(r.teamPlayers)}`;
      }

      embed.addFields({ name: r.name, value: summary });
    });

    if (removedLines > 0) {
      embed.addFields({
        name: `And ${removedLines} more`,
        value: ":large_orange_diamond: additional lines hidden due to discord limitations",
      });
    }

    return embed;
  }

  private ordinalSuffixOf(i: number): string {
    const j = i % 10;
    const k = i % 100;
    if (j === 1 && k !== 11) {
      return i + "st";
    }
    if (j === 2 && k !== 12) {
      return i + "nd";
    }
    if (j === 3 && k !== 13) {
      return i + "rd";
    }
    return i + "th";
  }

  private makeString(array: string[]): string {
    if (array.length === 0) return "";
    if (array.length === 1) return array[0];
    if (array.length === 2) return `${array[0]} and ${array[1]}`;
    return `${array.slice(0, -1).join(", ")}, and ${array[array.length - 1]}`;
  }
}
