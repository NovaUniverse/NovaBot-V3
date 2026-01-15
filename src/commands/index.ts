import { Command } from "./Command";
import { McfStatsCommand } from "./mcfstats";
import { McfTopCommand } from "./mcftop";
import { McfSoloTopCommand } from "./mcfsolotop";
import { Bot } from "../Bot";

export function initializeCommands(bot: Bot): Map<string, Command> {
  const mcfstats = new McfStatsCommand(bot);
  const mcftop = new McfTopCommand(bot);
  const mcfsolotop = new McfSoloTopCommand(bot);

  return new Map([
    ["mcfstats", mcfstats],
    ["mcftop", mcftop],
    ["mcfsolotop", mcfsolotop],
  ]);
}

export function getCommandsData(): any[] {
  // For command deployment, we create temporary instances with null bot
  const tempBot = null as any;
  const mcfstats = new McfStatsCommand(tempBot);
  const mcftop = new McfTopCommand(tempBot);
  const mcfsolotop = new McfSoloTopCommand(tempBot);

  return [
    mcfstats.data.toJSON(),
    mcftop.data.toJSON(),
    mcfsolotop.data.toJSON(),
  ];
}
