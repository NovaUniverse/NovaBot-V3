import { Bot } from "../Bot";
import mysql from "mysql2/promise";

export interface MCFPlayer {
  uid: number;
  has_nova_account: boolean;
  nova_account_name: string | null;
  username: string;
  uuid: string;
  team_number: number;
  score: number;
  kills: number;
}

export interface MCFTeam {
  team_number: number;
  team_score: number;
}

export interface MCFWeek {
  id: number;
  date: string;
  display_name: string;
  winner_team_id: number | null;
  teams: MCFTeam[];
  players: MCFPlayer[];
}

export class StatisticsDB {
  private readonly bot: Bot;
  private readonly pool: mysql.Pool;

  constructor(bot: Bot) {
    this.bot = bot;

    // Create MySQL connection pool
    this.pool = mysql.createPool({
      host: bot.config.statisticsDatabase.hostname,
      port: bot.config.statisticsDatabase.port,
      user: bot.config.statisticsDatabase.username,
      password: bot.config.statisticsDatabase.password,
      database: bot.config.statisticsDatabase.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log("MySQL connection pool created for statistics database");
    this.testConnection();
  }

  private async testConnection(): Promise<void> {
    try {
      const connection = await this.pool.getConnection();
      console.log("Successfully connected to statistics database");
      connection.release();
    } catch (error) {
      console.error("Failed to connect to statistics database:", error);
    }
  }

  public getPool(): mysql.Pool {
    return this.pool;
  }

  public async close(): Promise<void> {
    console.log("Closing statistics database connection pool...");
    await this.pool.end();
  }

  public async getMCFStatistics(): Promise<MCFWeek[]> {
    const result: MCFWeek[] = [];

    try {
      // Get all weeks
      const [weeks] = await this.pool.execute<mysql.RowDataPacket[]>(
        "SELECT id, tournament_date, display_name, winner_team_id FROM mcf_week"
      );

      for (const week of weeks) {
        const weekData: MCFWeek = {
          id: week.id,
          date: week.tournament_date,
          display_name: week.display_name,
          winner_team_id: week.winner_team_id,
          teams: [],
          players: [],
        };

        // Get team results for this week
        const [teams] = await this.pool.execute<mysql.RowDataPacket[]>(
          "SELECT team_number, team_score FROM mcf_team_result WHERE week_id = ?",
          [week.id]
        );

        for (const team of teams) {
          weekData.teams.push({
            team_number: team.team_number,
            team_score: team.team_score,
          });
        }

        // Get player results for this week
        const [players] = await this.pool.execute<mysql.RowDataPacket[]>(
          "SELECT id, user_id, team_number, score, kills FROM mcf_player_results WHERE week_id = ?",
          [week.id]
        );

        for (const playerResult of players) {
          // Fetch user data
          const [userData] = await this.pool.execute<mysql.RowDataPacket[]>(
            `SELECT mcfuser.uuid AS uuid, mcfuser.username AS username, account.username AS account_name
             FROM mcf_users AS mcfuser
             LEFT JOIN players AS p ON p.uuid = mcfuser.uuid
             LEFT JOIN accounts AS account ON account.player_id = p.id
             WHERE mcfuser.id = ?`,
            [playerResult.user_id]
          );

          if (userData.length > 0) {
            const user = userData[0];

            weekData.players.push({
              uid: playerResult.user_id,
              has_nova_account: user.account_name !== null,
              nova_account_name: user.account_name,
              username: user.username,
              uuid: user.uuid,
              team_number: playerResult.team_number,
              score: playerResult.score,
              kills: playerResult.kills,
            });
          }
        }

        result.push(weekData);
      }

      return result;
    } catch (error) {
      console.error("Error fetching MCF statistics:", error);
      throw error;
    }
  }
}

