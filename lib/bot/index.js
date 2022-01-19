"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const telegraf_1 = require("telegraf");
const telegraf_session_local_1 = __importDefault(require("telegraf-session-local"));
const getBusData_1 = require("../data/getBusData");
const helpers_1 = require("../helpers");
dotenv.config({ path: "config.env" });
const bot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN);
// MIDDLEWARES
bot.use((ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    const start = new Date().valueOf();
    yield next();
    const ms = new Date().valueOf() - start;
    console.log("Response time: %sms", ms);
}));
bot.use(new telegraf_session_local_1.default({ database: "db.json" }));
// bot.use(stage.middleware());
// bot.command("id", (ctx: any) => {
//   ctx.scene.enter("super-wizard");
// });
bot.command("/showDB", (ctx) => {
    ctx.replyWithMarkdown(`Database has \`${ctx.session.busData}\` messages from @${ctx.from.username || ctx.from.id}`);
});
bot.command("/clearDB", (ctx) => {
    ctx.replyWithMarkdown(`Removing session from database: \`${JSON.stringify(ctx.session)}\``);
    ctx.session = null;
});
////////////////
// Default commands
bot.catch((err, ctx) => {
    console.log(`Ooops, ecountered an error for ${ctx.updateType}`, err);
});
bot.start((ctx) => ctx.reply("Welcome to SBS Telegram bot. Send /find to learn how to find your next bus timing"));
/////////////////
// Commands
//bot.hears(/^[0-9 ]+$/, () => {});
(0, getBusData_1.botOnGetBusStop)(bot);
bot.command("find", (ctx) => {
    ctx.reply("Enter your bus service and bus stop seperated by a space");
    ctx.reply("Like this: 242 13091");
});
// MARKUP I +S BEING PERSISTED :(
bot.command("getBus", (ctx) => {
    (0, helpers_1.getBusDataMarkup)(ctx, "Click to find your bus timings.");
    bot.on("callback_query", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        ctx.telegram.answerCbQuery(ctx.callbackQuery.id);
        const cb = ctx.callbackQuery;
        const [serviceNo, busStopCode] = cb.data.split(" ");
        yield (0, getBusData_1.getBusTiming)(serviceNo, busStopCode, ctx);
    }));
});
bot.command("removeBus", (ctx) => {
    (0, helpers_1.getBusDataMarkup)(ctx, "Click to remove your option.");
    bot.on("callback_query", (ctx) => {
        console.log(ctx);
        ctx.telegram.answerCbQuery(ctx.callbackQuery.id);
        const cb = ctx.callbackQuery;
        const [serviceNo, busStopCode] = cb.data.split(" ");
        ctx.session.busData = ctx.session.busData.filter((el) => {
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
