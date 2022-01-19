const bot = require("./bot");
const cron = require("node-cron");

// cron.schedule("*/3 * * * * *", function () {
//   console.log("called");
//   bot.launch();
//   process.once("SIGINT", () => bot.stop("SIGINT"));
//   process.once("SIGTERM", () => bot.stop("SIGTERM"));
// });

const init = function (): void {
  bot.launch();
};

init();
