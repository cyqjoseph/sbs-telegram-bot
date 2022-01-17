import { Context } from "telegraf";

export interface BusArrivalTimings {
  OriginCode: number;
  DestinationCode: number;
  EstimatedArrival: string;
  Latitude: number;
  Longitude: number;
  VisitNumber: number;
}
export interface QueryWithData {
  data: string;
}

export interface MyContext extends Context {
  session: any;
}

export interface BusOption {
  serviceNo: string;
  busStopCode: string;
}
