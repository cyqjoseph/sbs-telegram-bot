const bot = require("./bot");
const cron = require("node-cron");

const init = function (): void {
  bot.launch();
};

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

init();
