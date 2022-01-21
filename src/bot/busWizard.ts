import { Scenes, Markup } from "telegraf";
import { getBusTiming } from "../data/getBusData";
import { getBusDataMarkup, findDuplicateBuses } from "../helpers";
import { WizardOptions, BusOption } from "../interfaces";

export const getBus = new Scenes.WizardScene(
  WizardOptions.GET_BUS_WIZARD,
  async (ctx: any) => {
    ctx.wizard.state.input = "";
    try {
      ctx.wizard.state.input = ctx.message.text;
      const [serviceNo, busStopCode] = ctx.message.text.split(" ");
      // Get bus timing and send to user
      await getBusTiming(serviceNo, busStopCode, ctx);
      // Ask User if he wants to save bus location to database
      ctx.replyWithMarkdown(
        "Would you like to save this option?",
        Markup.keyboard([Markup.button.text("Yes"), Markup.button.text("No")], {
          columns: 2,
        }).oneTime()
      );

      ctx.wizard.next();
    } catch (e: any) {
      ctx.reply("An error occurred, please try again later.");
      ctx.scene.leave();
    }
  },
  (ctx: any) => {
    if (ctx.message.text === "No") {
      ctx.reply("Option not saved, have a good day!");
      return ctx.scene.leave();
    }
    const [serviceNo, busStopCode] = ctx.wizard.state.input.split(" ");
    ctx.session.busData = ctx.session.busData || [];
    const option = { serviceNo, busStopCode };
    const busData = ctx.session.busData;

    if (findDuplicateBuses(busData, option)) {
      ctx.reply("Option already exists.");
    } else {
      ctx.reply("Adding option to database.");
      ctx.session.busData.push({ serviceNo, busStopCode });
      ctx.reply(
        "Option successfully added. Send /getBus to retrieve your past options."
      );
    }
    ctx.scene.leave();
  }
);

export const getBusFromCache = new Scenes.WizardScene(
  WizardOptions.GET_BUS_FROM_CACHE_WIZARD,
  (ctx: any) => {
    ctx.wizard.state.input = "";

    ctx.replyWithMarkdown(
      "Getting your saved buses",
      Markup.keyboard(getBusDataMarkup(ctx)).oneTime()
    );
    ctx.wizard.next();
  },
  async (ctx: any) => {
    ctx.wizard.state.input = ctx.message.text;
    const [serviceNo, busStopCode] = ctx.message.text.split(" ");
    await getBusTiming(serviceNo, busStopCode, ctx);

    ctx.scene.leave();
  }
);

export const removeBus = new Scenes.WizardScene(
  WizardOptions.REMOVE_BUS_WIZARD,
  (ctx: any) => {
    ctx.replyWithMarkdown(
      "Getting your saved buses",
      Markup.keyboard(getBusDataMarkup(ctx)).oneTime()
    );
    ctx.wizard.next();
  },
  (ctx: any) => {
    const [serviceNo, busStopCode] = ctx.message.text.split(" ");

    ctx.session.busData = ctx.session.busData.filter((el: BusOption) => {
      return el.serviceNo !== serviceNo || el.busStopCode !== busStopCode;
    });
    ctx.reply("Option removed successfully");
    ctx.scene.leave();
  }
);
