const dotenv = require("dotenv");
import { Telegraf } from "telegraf";

import LocalSession from "telegraf-session-local";

import { MyContext, WizardOptions } from "../interfaces";
import { getERPCosts } from "../data/getERPData";
import { Scenes } from "telegraf";
import { getCarparkAvailibilty } from "../data/getCarparkData";
import { getBusFromCache, getBus, removeBus } from "./busWizard";
dotenv.config({ path: "config.env" });

// Initializing bot
const bot = new Telegraf<MyContext>(process.env.TELEGRAM_BOT_TOKEN as string);
// Staging
const stage = new Scenes.Stage([
  getCarparkAvailibilty,
  getBusFromCache,
  getBus,
  removeBus,
]);

// MIDDLEWARES

bot.use(async (ctx, next: any) => {
  const start = new Date().valueOf();
  await next();
  const ms = new Date().valueOf() - start;
  console.log("Response time: %sms", ms);
});

bot.use(new LocalSession({ database: "db.json" }));
bot.use(stage.middleware());

////////////////
// Default commands
bot.start((ctx) =>
  ctx.reply(
    "Welcome to SBS Telegram bot. Send /find to learn how to find your next bus timing"
  )
);

bot.help((ctx) => {
  ctx.reply("Send /find to learn how to find your next bus");
  ctx.reply("Send /getERP to get ERP costs around Singapore now");
  ctx.reply("Send /getBus to get the list of your saved buses");
  ctx.reply("Send /getCarpark to get carkpark availibility spots");
  ctx.reply("Send /removeBus to remove one of your saved Buses");
});

bot.catch((err, ctx) => {
  console.log(`Ooops, ecountered an error for ${ctx.updateType}`, err);
});

/////////////////
// Commands
bot.command("find", (ctx) => {
  ctx.reply("Enter your bus service and bus stop seperated by a space");
  ctx.reply("Like this: 242 13091");
});

bot.command("getERP", async (ctx) => {
  await getERPCosts(ctx);
});

bot.command("getCarpark", (ctx) => {
  ctx.scene.enter(WizardOptions.CARPARK_WIZARD);
  return;
});

bot.command("getBus", (ctx) => {
  ctx.scene.enter(WizardOptions.GET_BUS_FROM_CACHE_WIZARD);
});

bot.command("removeBus", (ctx) => {
  ctx.scene.enter(WizardOptions.REMOVE_BUS_WIZARD);
});

bot.hears(/^[0-9 ]+$/, async (ctx) => {
  ctx.scene.enter(WizardOptions.GET_BUS_WIZARD);
});

//////////
// TESTIMG
bot.command("/showDB", (ctx) => {
  ctx.replyWithMarkdown(
    `Database has \`${ctx.session.busData}\` messages from @${
      ctx.from.username || ctx.from.id
    }`
  );
});

bot.command("/clearDB", (ctx) => {
  ctx.replyWithMarkdown(
    `Removing session from database: \`${JSON.stringify(ctx.session)}\``
  );
  ctx.session = null;
});

module.exports = bot;
