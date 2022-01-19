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
exports.botOnGetBusStop = exports.saveBusOption = exports.getBusTiming = exports.getBusStop = exports.getBusArrivalTimings = void 0;
const axios_1 = __importDefault(require("axios"));
const telegraf_1 = require("telegraf");
const helpers_1 = require("../helpers");
const getBusArrivalTimings = function (serviceNo, busStopCode) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield axios_1.default.get(`http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=${busStopCode}&ServiceNo=${serviceNo}`, { headers: { AccountKey: process.env.LTA_API_KEY } });
        return response;
    });
};
exports.getBusArrivalTimings = getBusArrivalTimings;
const getBusStop = function (busStopCode) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield axios_1.default.get(`http://datamall2.mytransport.sg/ltaodataservice/BusStops`, { headers: { AccountKey: process.env.LTA_API_KEY } });
        const busStop = response.data.value.find((el) => el.BusStopCode === busStopCode);
        const busStopLocation = `${busStop.RoadName}, ${(0, helpers_1.capitalizeWords)(busStop.Description.toLowerCase())}`;
        return busStopLocation;
    });
};
exports.getBusStop = getBusStop;
const getBusTiming = function (serviceNo, busStopCode, ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(serviceNo, busStopCode);
            const busStopLocation = yield (0, exports.getBusStop)(busStopCode);
            ctx.reply(`Fetching data for Bus ${serviceNo} at ${busStopLocation}`);
            const response = yield (0, exports.getBusArrivalTimings)(serviceNo, busStopCode);
            const nextBus = response.data.Services[0].NextBus;
            const nextBusArrival = Date.parse(nextBus.EstimatedArrival);
            const minutesToArrival = Math.floor((nextBusArrival - Date.now()) / 60000);
            ctx.reply(`Your bus ${serviceNo} will take ${minutesToArrival <= 0 ? 1 : minutesToArrival} minute(s) to arrive`);
        }
        catch (e) {
            ctx.reply(`Invalid bus code or service number. Please try again.`);
        }
    });
};
exports.getBusTiming = getBusTiming;
const saveBusOption = function (bot, ctx, serviceNo, busStopCode) {
    ctx.replyWithMarkdown("Would you like to save this option?", telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback("Yes", "saveData"),
        telegraf_1.Markup.button.callback("No", "exitSaveData"),
    ], { columns: 2 }));
    bot.action("saveData", (ctx) => {
        ctx.telegram.answerCbQuery(ctx.callbackQuery.id);
        ctx.session.busData = ctx.session.busData || [];
        const option = { serviceNo, busStopCode };
        const busData = ctx.session.busData;
        // // Option is persisting???
        // console.log(option);
        if ((0, helpers_1.findDuplicateBuses)(busData, option)) {
            ctx.reply("Option already exists.");
        }
        else {
            ctx.reply("Adding option to database.");
            ctx.session.busData.push({ serviceNo, busStopCode });
            ctx.reply("Option successfully added. Send /getBus to retrieve your past options.");
        }
    });
};
exports.saveBusOption = saveBusOption;
const botOnGetBusStop = function (bot) {
    return __awaiter(this, void 0, void 0, function* () {
        return bot.hears(/^[0-9 ]+$/, (ctx) => __awaiter(this, void 0, void 0, function* () {
            try {
                const [serviceNo, busStopCode] = ctx.message.text.split(" ");
                // Get bus timing and send to user
                yield (0, exports.getBusTiming)(serviceNo, busStopCode, ctx);
                // Ask User if he wants to save bus location to database
                // saveBusOption(bot, ctx, serviceNo, busStopCode);
            }
            catch (e) { }
        }));
    });
};
exports.botOnGetBusStop = botOnGetBusStop;
