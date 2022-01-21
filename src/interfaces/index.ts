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
  scene: any;
}

export interface BusOption {
  serviceNo: string;
  busStopCode: string;
}

export enum WizardOptions {
  CARPARK_WIZARD = "CARPARK_DATA_WIZARD",
  GET_BUS_FROM_CACHE_WIZARD = "GET_BUS_FROM_CACHE_WIZARD",
  GET_BUS_WIZARD = "GET_BUS_WIZARD",
  REMOVE_BUS_WIZARD = "REMOVE_BUS_WIZARD",
}
