import { BusOption, MyContext } from "../interfaces";
import { Markup } from "telegraf";
import moment from "moment";
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

export const getTimeNow = function () {
  const now = moment();
  const hourMin = now.format("HH:MM");
  const dayOfWeek = now.day();
  return { now, hourMin, dayOfWeek };
};

export const getWeekDay = function (num: number) {
  if (num === 6) {
    return "Saturdays";
  } else if (num == 0) {
    return null;
  } else {
    return "Weekdays";
  }
};

// export const getLotType = function (lotType: "C" | "H" | "Y") {
//   if (lotType === "C") {
//     return "Cars";
//   } else if (lotType === "Y") {
//     return "Motorcycles";
//   } else {
//     return "Heavy Vehicles";
//   }
// };
