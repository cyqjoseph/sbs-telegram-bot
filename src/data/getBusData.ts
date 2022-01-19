import axios from "axios";
import { Telegraf, Markup } from "telegraf";
import { capitalizeWords, findDuplicateBuses } from "../helpers";
import { BusArrivalTimings, MyContext } from "../interfaces";

export const getBusArrivalTimings = async function (
  serviceNo: string,
  busStopCode: string
) {
  const response = await axios.get(
    `http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=${busStopCode}&ServiceNo=${serviceNo}`,
    { headers: { AccountKey: process.env.LTA_API_KEY as string } }
  );
  return response;
};

export const getBusStop = async function (busStopCode: string) {
  const response = await axios.get(
    `http://datamall2.mytransport.sg/ltaodataservice/BusStops`,
    { headers: { AccountKey: process.env.LTA_API_KEY as string } }
  );
  const busStop = response.data.value.find(
    (el: { BusStopCode: string }) => el.BusStopCode === busStopCode
  );
  const busStopLocation = `${busStop.RoadName}, ${capitalizeWords(
    busStop.Description.toLowerCase()
  )}`;
  return busStopLocation;
};

export const getBusTiming = async function (
  serviceNo: string,
  busStopCode: string,
  ctx: MyContext
) {
  try {
    console.log(serviceNo, busStopCode);
    const busStopLocation = await getBusStop(busStopCode);

    ctx.reply(`Fetching data for Bus ${serviceNo} at ${busStopLocation}`);
    const response = await getBusArrivalTimings(serviceNo, busStopCode);

    const nextBus = response.data.Services[0].NextBus as BusArrivalTimings;

    const nextBusArrival = Date.parse(nextBus.EstimatedArrival);

    const minutesToArrival = Math.floor((nextBusArrival - Date.now()) / 60000);

    ctx.reply(
      `Your bus ${serviceNo} will take ${
        minutesToArrival <= 0 ? 1 : minutesToArrival
      } minute(s) to arrive`
    );
  } catch (e: any) {
    ctx.reply(`Invalid bus code or service number. Please try again.`);
  }
};

export const saveBusOption = function (
  bot: Telegraf<MyContext>,
  ctx: MyContext,
  serviceNo: string,
  busStopCode: string
) {
  ctx.replyWithMarkdown(
    "Would you like to save this option?",
    Markup.inlineKeyboard(
      [
        Markup.button.callback("Yes", "saveData"),
        Markup.button.callback("No", "exitSaveData"),
      ],
      { columns: 2 }
    )
  );
  bot.action("saveData", (ctx) => {
    ctx.telegram.answerCbQuery(ctx.callbackQuery.id);
    ctx.session.busData = ctx.session.busData || [];
    const option = { serviceNo, busStopCode };
    const busData = ctx.session.busData;
    // // Option is persisting???
    // console.log(option);

    if (findDuplicateBuses(busData, option)) {
      ctx.reply("Option already exists.");
    } else {
      ctx.reply("Adding option to database.");
      ctx.session.busData.push({ serviceNo, busStopCode });
      ctx.reply(
        "Option successfully added. Send /getBus to retrieve your past options."
      );
    }
  });
};

export const botOnGetBusStop = async function (bot: Telegraf<MyContext>) {
  return bot.hears(/^[0-9 ]+$/, async (ctx) => {
    try {
      const [serviceNo, busStopCode] = ctx.message.text.split(" ");
      // Get bus timing and send to user
      await getBusTiming(serviceNo, busStopCode, ctx);
      // Ask User if he wants to save bus location to database

      // saveBusOption(bot, ctx, serviceNo, busStopCode);
    } catch (e: any) {}
  });
};
