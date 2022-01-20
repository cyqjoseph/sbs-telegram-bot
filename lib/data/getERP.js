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
exports.getERPCosts = void 0;
const axios_1 = __importDefault(require("axios"));
const moment_1 = __importDefault(require("moment"));
const table_1 = require("table");
const helpers_1 = require("../helpers");
const getERPCosts = function (ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield axios_1.default.get(`http://datamall2.mytransport.sg/ltaodataservice/ERPRates`, { headers: { AccountKey: process.env.LTA_API_KEY } });
        const { dayOfWeek } = (0, helpers_1.getTimeNow)();
        const DayType = (0, helpers_1.getWeekDay)(dayOfWeek);
        if (!DayType) {
            ctx.replyWithHTML("<b><i>Today is Sunday, no ERP charges!</i></b>");
            return;
        }
        const filteredData = response.data.value.filter((el) => {
            const StartTime = (0, moment_1.default)(el.StartTime, "HH:mm");
            const EndTime = (0, moment_1.default)(el.EndTime, "HH:mm");
            return (el.DayType === DayType &&
                (0, moment_1.default)().isBetween(StartTime, EndTime, "minutes", "[]") &&
                el.ChargeAmount !== 0);
        });
        if (filteredData.length === 0) {
            ctx.replyWithHTML("<b><i>No ERP Charge at this time!</i></b>");
            return;
        }
        const cleanedData = filteredData.map((el) => {
            delete el.DayType;
            delete el.EffectiveDate;
            delete el.ZoneID;
            return el;
        });
        let data = cleanedData.map((el) => {
            const cost = `$${el.ChargeAmount.toFixed(2)}`;
            const vehicleType = el.VehicleType.split("/")[0];
            return [vehicleType, el.StartTime, el.EndTime, cost];
        });
        data.unshift(["Vehicle", "Start", "End", "Cost"]);
        const result = (0, table_1.table)(data, {
            columns: [
                { width: 30, alignment: "left" },
                { alignment: "center" },
                { alignment: "center" },
                { alignment: "center" },
            ],
            header: {
                alignment: "center",
                content: `ERP Costs at ${(0, moment_1.default)().format("HH:mm")}HRS`,
            },
        });
        ctx.replyWithHTML(`<pre>${result}</pre>`);
        return filteredData;
    });
};
exports.getERPCosts = getERPCosts;
// Moment testing
//"2022-01-20, 08:40:00", "YYYY-MM-DD, HH:mm:ss"
