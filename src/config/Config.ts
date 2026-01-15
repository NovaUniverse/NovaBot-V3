export interface Config {
  botToken: string;
  statisticsDatabase: SQLConfig;
}

export interface SQLConfig {
  hostname: string;
  port: number;
  username: string;
  password: string;
  database: string;
}
