const dotenv = require("dotenv");
const { Composer } = require("micro-bot");
import { Telegraf } from "telegraf";

import LocalSession from "telegraf-session-local";
import { botOnGetBusStop, getBusTiming } from "../data/getBusData";
import { QueryWithData, MyContext, BusOption } from "../interfaces";
import { getBusDataMarkup } from "../helpers";

dotenv.config({ path: "config.env" });

const bot = new Telegraf<MyContext>(process.env.TELEGRAM_BOT_TOKEN as string);

// MIDDLEWARES
bot.use(async (ctx, next: any) => {
  const start = new Date().valueOf();
  await next();
  const ms = new Date().valueOf() - start;
  console.log("Response time: %sms", ms);
});

bot.use(new LocalSession({ database: "db.json" }));
// bot.use(stage.middleware());
// bot.command("id", (ctx: any) => {
//   ctx.scene.enter("super-wizard");
// });

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

////////////////
// Default commands
bot.catch((err, ctx) => {
  console.log(`Ooops, ecountered an error for ${ctx.updateType}`, err);
});

bot.start((ctx) =>
  ctx.reply(
    "Welcome to SBS Telegram bot. Send /find to learn how to find your next bus timing"
  )
);

/////////////////
// Commands
//bot.hears(/^[0-9 ]+$/, () => {});

botOnGetBusStop(bot);

bot.command("find", (ctx) => {
  ctx.reply("Enter your bus service and bus stop seperated by a space");
  ctx.reply("Like this: 242 13091");
});

// MARKUP I +S BEING PERSISTED :(
bot.command("getBus", (ctx) => {
  getBusDataMarkup(ctx, "Click to find your bus timings.");
  bot.on("callback_query", async (ctx) => {
    ctx.telegram.answerCbQuery(ctx.callbackQuery.id);
    const cb = ctx.callbackQuery as QueryWithData;
    const [serviceNo, busStopCode] = cb.data.split(" ");
    await getBusTiming(serviceNo, busStopCode, ctx);
  });
});

bot.command("removeBus", (ctx) => {
  getBusDataMarkup(ctx, "Click to remove your option.");
  bot.on("callback_query", (ctx) => {
    console.log(ctx);
    ctx.telegram.answerCbQuery(ctx.callbackQuery.id);
    const cb = ctx.callbackQuery as QueryWithData;

    const [serviceNo, busStopCode] = cb.data.split(" ");

    ctx.session.busData = ctx.session.busData.filter((el: BusOption) => {
      return el.serviceNo !== serviceNo || el.busStopCode !== busStopCode;
    });
    ctx.reply("Option removed successfully");
  });
});

/////////////
// Actions
bot.action("exitSaveData", (ctx) => {
  ctx.telegram.answerCbQuery(ctx.callbackQuery.id);
  ctx.reply("Option not saved, have a good day!");
});

module.exports = bot;
