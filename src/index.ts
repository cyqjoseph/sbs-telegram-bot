const bot = require("./bot");

const init = function (): void {
  bot.launch();
};

init();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
