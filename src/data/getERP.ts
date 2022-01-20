import axios from "axios";
import moment from "moment";
import { table } from "table";
import { MyContext } from "../interfaces";
import { getTimeNow, getWeekDay } from "../helpers";

interface FilteredData {
  VehicleType: string;
  DayType?: "Weekdays" | "Saturdays";
  StartTime: string;
  EndTime: string;
  ZoneID?: string;
  ChargeAmount: number;
  EffectiveDate?: string;
}

type CleanedData = Omit<FilteredData, "ZoneID" | "EffectiveDate" | "DayType">;

export const getERPCosts = async function (ctx: MyContext) {
  const response = await axios.get(
    `http://datamall2.mytransport.sg/ltaodataservice/ERPRates`,
    { headers: { AccountKey: process.env.LTA_API_KEY as string } }
  );
  const { dayOfWeek } = getTimeNow();
  const DayType = getWeekDay(dayOfWeek);
  if (!DayType) {
    ctx.replyWithHTML("<b><i>Today is Sunday, no ERP charges!</i></b>");
    return;
  }
  const filteredData: FilteredData[] = response.data.value.filter(
    (el: FilteredData) => {
      const StartTime = moment(el.StartTime, "HH:mm");
      const EndTime = moment(el.EndTime, "HH:mm");
      return (
        el.DayType === DayType &&
        moment().isBetween(StartTime, EndTime, "minutes", "[]") &&
        el.ChargeAmount !== 0
      );
    }
  );
  if (filteredData.length === 0) {
    ctx.replyWithHTML("<b><i>No ERP Charge at this time!</i></b>");
    return;
  }

  const cleanedData: CleanedData[] = filteredData.map((el: FilteredData) => {
    delete el.DayType;
    delete el.EffectiveDate;
    delete el.ZoneID;
    return el;
  });

  let data = cleanedData.map((el: CleanedData) => {
    const cost = `$${el.ChargeAmount.toFixed(2)}`;
    const vehicleType = el.VehicleType.split("/")[0];
    return [vehicleType, el.StartTime, el.EndTime, cost];
  });

  data.unshift(["Vehicle", "Start", "End", "Cost"]);

  const result = table(data, {
    columns: [
      { width: 30, alignment: "left" },
      { alignment: "center" },
      { alignment: "center" },
      { alignment: "center" },
    ],
    header: {
      alignment: "center",
      content: `ERP Costs at ${moment().format("HH:mm")}HRS`,
    },
  });
  ctx.replyWithHTML(`<pre>${result}</pre>`);
  return filteredData;
};
// Moment testing
//"2022-01-20, 08:40:00", "YYYY-MM-DD, HH:mm:ss"
