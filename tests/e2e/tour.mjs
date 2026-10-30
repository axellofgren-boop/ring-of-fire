// A walk through every screen of the game. Each stop is a picture for the screenshot set and a place the layout checks run.
// Each flow starts from fresh saved settings, so flows don't depend on each other.
import { act, drawRank, resolveCard, backToRing, seedState, settle, saved } from "./driver.mjs";

const soloState = game => seedState({ minis: true, pick: [game] });

export const FLOWS = [
  {
    name: "setup",
    state: seedState(),
    async run(page, shot) {
      await shot("setup");
      await act(page, '[data-act="fold"][data-k="house"]');
      await shot("setup-house-rules");
      await act(page, '[data-act="rules"]');
      await shot("rules-editor");
      await act(page, '[data-act="rules-done"]');
      await act(page, '[data-act="minis-open"]');
      await shot("setup-mini-games");
    }
  },
  {
    name: "ring",
    state: seedState({ freq: 0 }),
    async run(page, shot) {
      await act(page, '[data-act="start"]');
      await shot("ring-start");
      await drawRank(page, "K");
      await shot("card-king");
      await resolveCard(page);
      await drawRank(page, "6");
      await resolveCard(page);
      await drawRank(page, "J");
      await shot("card-make-rule");
      await resolveCard(page);
      await drawRank(page, "8");
      await act(page, '.sheet [data-act="mate"]');
      await shot("card-mate");
      await resolveCard(page);
      await drawRank(page, "2");
      await shot("card-two");
      await resolveCard(page);
      await drawRank(page, "7");
      await act(page, '.sheet [data-act="pick"]');
      await shot("card-pick");
      await resolveCard(page);
      await shot("ring-with-roles");
      await act(page, '[data-act="menu"]');
      await shot("cog-scores");
      await act(page, '[data-act="tab"][data-k="rules"]');
      await shot("cog-rules");
      await act(page, '[data-act="tab"][data-k="settings"]');
      await shot("cog-settings");
      await act(page, '[data-act="close"].iconbtn');
      await act(page, '[data-act="challenge"]');
      await act(page, '.sheet [data-act="challenger"]');
      await shot("challenge");
      await act(page, '[data-act="roll"]');
      await shot("challenge-rolled");
      const pay = page.locator('[data-act="pay"]');
      if (await pay.count()) await act(page, '[data-act="pay"]'); else await act(page, '[data-act="coup"]');
      await act(page, '[data-act="penalty"]');
      await act(page, '.sheet [data-act="pick"]');
      await shot("penalty");
      await act(page, '[data-act="penalty-ok"]');
      // Play on to halftime and then to the end of the deck.
      while ((await saved(page)).screen === "game" && (await saved(page)).game.turn < 26) { await drawRank(page, null); await resolveCard(page); }
      await shot("halftime");
      await act(page, '[data-act="half-pick"] >> nth=0');
      await act(page, '[data-act="half-ok"]');
      await shot("ring-half-way");
      for (let s = await saved(page); s.screen !== "end"; s = await saved(page)) {
        if (s.screen !== "game") { await backToRing(page); continue; }
        await drawRank(page, null); await resolveCard(page);
      }
      await shot("end-awards");
      for (const k of ["chart", "scores", "night"]) { await act(page, `[data-act="end-tab"][data-k="${k}"]`); await shot("end-" + k); }
    }
  },
  {
    // The first few cards and the cogwheel, for the quick checks at extra screen sizes.
    name: "ring-short",
    checksOnly: true,
    state: seedState({ freq: 0 }),
    async run(page, shot) {
      await act(page, '[data-act="start"]');
      await shot("ring-start");
      for (const rank of ["K", "6", "J", "Q"]) { await drawRank(page, rank); await shot("card-" + rank); await resolveCard(page); }
      await shot("ring-with-roles");
      await act(page, '[data-act="menu"]');
      await shot("cog-scores");
      await act(page, '[data-act="close"].iconbtn');
      await drawRank(page, "3");
      await shot("card-three");
    }
  },
  {
    name: "horse-race",
    state: soloState("Horse Race"),
    async run(page, shot) {
      await act(page, '[data-act="start"]');
      const suits = page.locator('[data-act="hr-suit"]');
      const n = await suits.count();
      for (let i = 0; i < n; i += 4) await act(page, `[data-act="hr-suit"] >> nth=${i + (i / 4) % 4}`);
      await shot("race-bets");
      await act(page, '[data-act="hr-start"]');
      await act(page, '[data-act="hr-flip"]');
      await act(page, '[data-act="hr-flip"]');
      await shot("race-running");
      while (await page.locator('[data-act="hr-flip"]').count()) await act(page, '[data-act="hr-flip"]', { wait: 50 });
      await settle(page);
      await shot("race-finished");
    }
  },
  {
    name: "bomb",
    state: soloState("The Bomb"),
    async run(page, shot) {
      await act(page, '[data-act="start"]');
      await shot("bomb-setup");
      await act(page, '[data-act="bm-light"]', { wait: 1000 });
      await shot("bomb-live");
      await settle(page, 200000);
      await shot("bomb-boom");
      await act(page, '[data-act="bm-victim"]');
      await act(page, '[data-act="bm-log"]');
      await shot("bomb-logged");
    }
  },
  {
    name: "door",
    state: soloState("The Door"),
    async run(page, shot) {
      await act(page, '[data-act="start"]');
      await shot("door-pick");
      // Each player takes the next door along, so the doors split the table and someone is soon the last one standing.
      const pickDoor = async d => act(page, `[data-act="dr-door"] >> nth=${Object.keys(d.picks).length % d.safe.length}`);
      // Caught mid-glow, so the picture shows which door the first player just chose.
      await act(page, '[data-act="dr-door"] >> nth=0', { wait: 300 });
      await shot("door-picked");
      for (let s = await saved(page); s.game.door.phase === "pick"; s = await saved(page)) await pickDoor(s.game.door);
      await shot("door-reveal");
      for (let s = await saved(page), guard = 0; s.game.door.phase === "reveal" || s.game.door.phase === "pick"; s = await saved(page)) {
        if (++guard > 60) throw new Error("The Door never found a winner");
        if (s.game.door.phase === "pick") await pickDoor(s.game.door);
        else if (s.game.door.winner) await act(page, '[data-act="dr-win"]');
        else await act(page, '[data-act="dr-next"]');
      }
      await shot("door-winner");
      await act(page, '[data-act="dr-victim"]');
      await shot("door-done");
    }
  },
  {
    name: "impostor",
    state: soloState("The Impostor"),
    async run(page, shot) {
      await act(page, '[data-act="start"]');
      await shot("impostor-intro");
      await act(page, '[data-act="im-start"]');
      await shot("impostor-pass");
      await act(page, '[data-act="im-show"]');
      await shot("impostor-secret");
      for (let s = await saved(page); s.game.imp.phase === "roles"; s = await saved(page)) {
        if (!s.game.imp.show) await act(page, '[data-act="im-show"]');
        await act(page, '[data-act="im-hide"]');
      }
      await shot("impostor-clues");
      await act(page, '[data-act="im-vote"]');
      await act(page, '[data-act="im-accuse"] >> nth=1');
      await shot("impostor-vote");
      await act(page, '[data-act="im-reveal"]');
      if (await page.locator('[data-act="im-guess"]').count()) { await shot("impostor-guess"); await act(page, '[data-act="im-guess"][data-k="0"]'); }
      await shot("impostor-result");
    }
  }
];
