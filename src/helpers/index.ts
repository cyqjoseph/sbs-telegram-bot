import { BusOption, MyContext } from "../interfaces";
import { Markup } from "telegraf";
export const capitalizeWords = function (val: string) {
  return val.replace(/(?:^|\s)\S/g, function (a) {
    return a.toUpperCase();
  });
};

export const findBus = function (
  sessionData: BusOption[],
  query: BusOption
): BusOption | undefined {
  return sessionData.find((el) => {
    return (
      el.serviceNo === query.serviceNo && el.busStopCode === query.busStopCode
    );
  });
};

export const findDuplicateBuses = function (
  sessionData: BusOption[],
  query: BusOption
): boolean {
  if (findBus(sessionData, query)) {
    return true;
  }
  return false;
};

export const getBusDataMarkup = function (ctx: MyContext, message: string) {
  let markupData;
  const { busData } = ctx.session;
  if (!busData) {
    ctx.reply("No options saved. Please enter your option manually");
  } else {
    markupData = busData.map((el: BusOption) => {
      return Markup.button.callback(
        `${el.serviceNo} ${el.busStopCode}`,
        `${el.serviceNo} ${el.busStopCode}`
      );
    });
    ctx.reply(message, Markup.inlineKeyboard(markupData, { columns: 2 }));
  }
  return markupData;
};
