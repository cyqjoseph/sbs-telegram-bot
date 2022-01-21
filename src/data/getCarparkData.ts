import axios from "axios";
import { table } from "table";
import { Scenes, Markup } from "telegraf";
import { capitalizeWords } from "../helpers";

interface CarparkData {
  Area: string;
  Development: string;
  AvailableLots: number;
  Agency: "HDB" | "LTA" | "URA";
  Location?: string;
  CarParkID?: string;
  LotType?: "C" | "H" | "Y";
}

type CleanedCarparkData = Omit<CarparkData, "Location" | "CarParkID">;

const areaOptions = [
  "Orchard",
  "Marina",
  "HarbourFront",
  "Jurong Lake",
  "Others",
];
const areaHeaders: [string, string] = ["Location", "Lots left"];
const developmentHeaders = ["Location", "Lots left"];
const lotTypeLegend = table(
  [
    ["Legend", "Lot Type"],
    ["C", "Cars"],
    ["Y", "Motorcycles"],
    ["H", "Heavy Vehicles"],
  ],
  {
    columns: [{ alignment: "center" }, { alignment: "center" }],
    header: {
      alignment: "center",
      content: `Carpark Lot Types`,
    },
  }
);

export const getCarparkAvailibilty = new Scenes.WizardScene(
  "CARPARK_DATA_WIZARD",
  (ctx: any) => {
    console.log("called in wizard");
    ctx.replyWithMarkdown(
      "Where is the location of the carpark?",
      Markup.keyboard(
        areaOptions.map((el: string) => Markup.button.text(el)),
        {
          columns: 3,
        }
      ).oneTime()
    );
    ctx.wizard.state.location = "";
    return ctx.wizard.next();
  },
  async (ctx: any) => {
    ctx.wizard.state.data = null;
    ctx.wizard.state.location = ctx.message.text;
    const { location } = ctx.wizard.state;

    try {
      const response = await axios.get(
        `http://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2`,
        { headers: { AccountKey: process.env.LTA_API_KEY as string } }
      );
      const carparkData: CarparkData[] = response.data.value;
      // Storing carparkData in wizard

      const cleanedCarparkData: CleanedCarparkData[] = carparkData.map(
        (el: CarparkData) => {
          delete el.Location;
          delete el.CarParkID;
          el.Development = el.Development.toLowerCase()
            .split(" ")
            .slice(0, 3)
            .join(" ");
          // .replace(/[/|&"<>()+,]/g, "");
          if (el.Development.includes("off")) {
            el.Development = el.Development.split(" ").slice(0, 2).join(" ");
          }
          return el;
        }
      );
      ctx.wizard.state.data = cleanedCarparkData;

      // Finding by area
      if (areaOptions.slice(0, 4).includes(ctx.message.text)) {
        ctx.replyWithHTML(`Finding all carparks near <b>${location}</b>`);

        // Data modifications for API call
        if (ctx.message.text === "HarbourFront") {
          ctx.message.text = "Harbfront";
        } else if (ctx.message.text === "Jurong Lake") {
          ctx.message.text = "JurongLakeDistrict";
        }

        const filteredByArea: CleanedCarparkData[] = cleanedCarparkData.filter(
          (el: CleanedCarparkData) => {
            return el.Area.toLowerCase() === ctx.message.text.toLowerCase();
          }
        );
        let data: [string, string | number][] = filteredByArea.map(
          (el: CleanedCarparkData) => {
            return [capitalizeWords(el.Development), el.AvailableLots];
          }
        );
        data.unshift(areaHeaders);
        // Handle long messages
        const result = table(data, {
          columns: [{ alignment: "center" }, { alignment: "center" }],
          header: {
            alignment: "center",
            content: `Carpark Lot Availbility`,
          },
        });

        ctx.replyWithHTML(`<pre>${result}</pre>`);
        // Leave wizard scene
        ctx.scene.leave();
      } else {
        ctx.reply("Describe the location of your carpark");
        ctx.wizard.next();
      }
    } catch (e) {
      console.log(e);
    }
  },
  // Filtering by Development
  (ctx: any) => {
    try {
      ctx.wizard.state.location = ctx.message.text;
      const { location } = ctx.wizard.state;
      ctx.replyWithHTML(`Finding all carparks near <b>${location}</b>`);
      const cleanedCarparkData: CleanedCarparkData[] = ctx.wizard.state.data;

      const filteredByDevelopment: CleanedCarparkData[] =
        cleanedCarparkData.filter((el: CleanedCarparkData) =>
          el.Development.includes(location.toLowerCase())
        );

      if (filteredByDevelopment.length === 0) {
        ctx.reply(`No locations near ${location} found, Please try again`);
        ctx.reply("Describe the location of your carpark");
        return ctx.wizard.selectStep(2);
      }

      let data = filteredByDevelopment.map((el: CleanedCarparkData) => {
        return [
          `${capitalizeWords(el.Development)} (${el.LotType})`,
          el.AvailableLots,
        ];
      });
      if (data.length > 15) {
        ctx.reply(`Location ${location} is too vague! Please try again`);
        ctx.reply("Describe the location of your carpark again");
        return ctx.wizard.selectStep(2);
      }
      data.unshift(developmentHeaders);
      const result = table(data, {
        columns: [{ alignment: "center" }, { alignment: "center" }],
        header: {
          alignment: "center",
          content: `Carpark Lot Availbility`,
        },
      });
      ctx.replyWithHTML(`<pre>${lotTypeLegend}</pre>`);
      ctx.replyWithHTML(`<pre>${result}</pre>`);
      ctx.scene.leave();
    } catch (e) {
      console.log(e);
    }
    ctx.scene.leave();
  }
);
