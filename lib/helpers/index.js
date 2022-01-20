"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeekDay = exports.getTimeNow = exports.getBusDataMarkup = exports.findDuplicateBuses = exports.findBus = exports.capitalizeWords = void 0;
const telegraf_1 = require("telegraf");
const moment_1 = __importDefault(require("moment"));
const capitalizeWords = function (val) {
    return val.replace(/(?:^|\s)\S/g, function (a) {
        return a.toUpperCase();
    });
};
exports.capitalizeWords = capitalizeWords;
const findBus = function (sessionData, query) {
    return sessionData.find((el) => {
        return (el.serviceNo === query.serviceNo && el.busStopCode === query.busStopCode);
    });
};
exports.findBus = findBus;
const findDuplicateBuses = function (sessionData, query) {
    if ((0, exports.findBus)(sessionData, query)) {
        return true;
    }
    return false;
};
exports.findDuplicateBuses = findDuplicateBuses;
const getBusDataMarkup = function (ctx, message) {
    let markupData;
    const { busData } = ctx.session;
    if (!busData) {
        ctx.reply("No options saved. Please enter your option manually");
    }
    else {
        markupData = busData.map((el) => {
            return telegraf_1.Markup.button.callback(`${el.serviceNo} ${el.busStopCode}`, `${el.serviceNo} ${el.busStopCode}`);
        });
        ctx.reply(message, telegraf_1.Markup.inlineKeyboard(markupData, { columns: 2 }));
    }
    return markupData;
};
exports.getBusDataMarkup = getBusDataMarkup;
const getTimeNow = function () {
    const now = (0, moment_1.default)();
    const hourMin = now.format("HH:MM");
    const dayOfWeek = now.day();
    return { now, hourMin, dayOfWeek };
};
exports.getTimeNow = getTimeNow;
const getWeekDay = function (num) {
    if (num === 6) {
        return "Saturdays";
    }
    else if (num == 0) {
        return null;
    }
    else {
        return "Weekdays";
    }
};
exports.getWeekDay = getWeekDay;
