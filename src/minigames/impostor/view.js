import { backTxt, miniTag, soloOne } from "../../core/game.js";
import { player, S } from "../../core/state.js";
import { esc } from "../../core/util.js";
import { fold } from "../../ui/components.js";
import { IMP_SIPS } from "./logic.js";

export function viewImpostor(m) {
  const g = S.game, nm = id => esc(player(id).name), n = g.order.length;
  const hero = (title, sub) => `<div class="mini-hero" style="padding-top:8px;gap:4px"><span class="label">${miniTag()}</span><h1>${title}</h1>${sub ? `<p class="muted" style="margin:0;max-width:36ch">${sub}</p>` : ""}</div>`;
  let body = "";
  if (m.phase === "intro") {
    body = hero("The Impostor") + (n < 3
      ? `<div class="callout">The Impostor needs at least 3 players.</div>
         <button class="btn fire wide" data-act="${soloOne() ? "exit" : "mini-done"}" style="min-height:56px">${soloOne() ? "Back to the start" : backTxt()}</button>`
      : `${fold("howto", "How to play", `<div class="callout">Everyone gets the same <b>secret word</b>, except one <b>Impostor</b> who only sees the category. Pass the phone round and peek at your role in secret. Then give one-word clues and vote out the Impostor.</div>
         <div class="callout"><b>Impostor caught:</b> they take a shot, unless they can guess the word.<br><b>Impostor gets away:</b> everyone else drinks ${IMP_SIPS}, and anyone voted out by mistake takes a shot.</div>`)}
         <button class="btn fire wide" data-act="im-start" style="min-height:56px">Hand out the roles</button>
         ${soloOne() ? "" : `<button class="btn ghost wide" data-act="mini-done">Skip The Impostor</button>`}`);
  } else if (m.phase === "roles") {
    const who = g.order[m.seat], next = g.order[m.seat + 1];
    const dots = `<div class="imp-dots" aria-label="Role ${m.seat + 1} of ${n}">${g.order.map((_, i) => `<i class="${i < m.seat ? "on" : ""}"></i>`).join("")}</div>`;
    body = m.show
      ? `${dots}<div class="imp-secret ${who === m.imp ? "imp" : ""}">
           <span class="label">${who === m.imp ? "You are" : "Secret word"}</span>
           <div class="imp-word">${who === m.imp ? "The Impostor" : esc(m.word)}</div>
           <span class="sub">${who === m.imp ? `Category: <b>${esc(m.cat)}</b>. Bluff your clue and blend in.` : `Category: ${esc(m.cat)}`}</span>
         </div>
         <button class="btn primary wide" data-act="im-hide" style="min-height:56px">Hide it${next ? ` · pass to ${nm(next)}` : ""}</button>`
      : `${hero("The Impostor")}${dots}<div class="imp-pass">
           <span class="label">Pass the phone to</span>
           <div class="holder">${nm(who)}</div>
           <span class="muted">Everyone else, look away</span>
         </div>
         <button class="btn fire wide" data-act="im-show" style="min-height:56px">I'm ${nm(who)}, show me</button>`;
    return `<div class="wrap">${body}</div>`;
  } else if (m.phase === "clues") {
    const order = g.order.map((_, i) => g.order[(m.first + i) % n]);
    body = hero("Clue time", "One word each. Too obvious and the Impostor learns the word. Too vague and you look guilty.") + `
      <section class="panel"><span class="label">Clue order · category ${esc(m.cat)}</span><ol class="imp-order">${order.map(pid => `<li>${nm(pid)}</li>`).join("")}</ol></section>
      <button class="btn fire wide" data-act="im-vote" style="min-height:56px">Clues done, vote</button>`;
  } else if (m.phase === "vote") {
    const chips = g.order.map(pid => `<button class="chip" data-act="im-accuse" data-id="${pid}" aria-pressed="${m.accused === pid}">${nm(pid)}</button>`).join("")
      + `<button class="chip" data-act="im-accuse" data-id="none" aria-pressed="${m.accused === "none"}">Tie, nobody</button>`;
    body = hero("Who's the Impostor?", "Argue it out, then everyone points on three.") + `
      <section class="panel"><span class="label">Most votes</span><div class="chips">${chips}</div></section>
      <button class="btn fire wide" data-act="im-reveal" style="min-height:56px" ${m.accused ? "" : "disabled"}>${!m.accused ? "Tap who got the most votes" : m.accused === "none" ? "Reveal" : `Reveal ${nm(m.accused)}`}</button>`;
  } else if (m.phase === "guess") {
    body = `<div class="bomb-stage" style="padding-top:18px"><span class="label">Caught!</span><div class="holder">${nm(m.imp)}</div><div class="verdict good">is the Impostor</div></div>
      <section class="panel"><h2>Last chance</h2><span class="muted">${nm(m.imp)}, say your guess for the secret word out loud. Did they get it?</span>
        <div class="victims"><button class="btn" data-act="im-guess" data-k="1">Guessed it</button><button class="btn" data-act="im-guess" data-k="0">Wrong</button></div>
      </section>`;
  } else {
    const why = !m.caught ? (m.accused === "none" ? "The vote tied, so the Impostor stayed hidden." : `${nm(m.accused)} was innocent. ${nm(m.imp)} stayed hidden.`)
      : m.guessed ? `${nm(m.imp)} was caught but guessed the word.` : `${nm(m.imp)} was caught and missed the word.`;
    body = `<div class="verdict ${m.win ? "bad" : "good"}" style="font-size:1.7rem;padding-top:12px">${m.win ? "The Impostor wins!" : "Civilians win!"}</div>
      <div class="imp-secret" style="min-height:0"><span class="label">The Impostor was</span><div class="imp-word" style="font-size:clamp(1.8rem, 9vw, 2.6rem)">${nm(m.imp)}</div><span class="sub">The word was <b>${esc(m.word)}</b></span></div>
      <div class="callout" style="text-align:center">${why} ${m.win ? `Everyone else drinks ${IMP_SIPS}.${!m.caught && m.accused !== "none" ? ` ${nm(m.accused)} takes a shot for the false accusation.` : ""}` : `${nm(m.imp)} takes a shot.`}</div>
      <button class="btn ${soloOne() ? "fire" : "primary"} wide" data-act="im-again" ${soloOne() ? 'style="min-height:56px"' : ""}>Play another round</button>
      ${soloOne() ? "" : `<button class="btn fire wide" data-act="mini-done" style="min-height:56px">${backTxt()}</button>`}`;
  }
  return `<div class="wrap">${body}</div>`;
}
