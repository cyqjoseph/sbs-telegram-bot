import axios from "axios";
import { capitalizeWords } from "../helpers";
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
