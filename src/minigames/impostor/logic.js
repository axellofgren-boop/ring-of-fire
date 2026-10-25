import { logDrink } from "../../core/drinks.js";
import { fx } from "../../core/effects.js";
import { ev } from "../../core/game.js";
import { player, S } from "../../core/state.js";

// ---------- The Impostor ----------
// Everyone gets the same secret word except one Impostor, who only sees the category. The phone goes round in setup order
// for a private peek, then everyone gives a one-word clue and the table votes. Caught Impostors get one guess at the word.
export const IMP_WORDS = {
  "Food": ["Pizza", "Sushi", "Taco", "Pancake", "Popcorn", "Burger", "Spaghetti", "Chocolate", "Banana", "Cheese", "Ice cream", "Hot dog", "Meatballs", "Kebab"],
  "Drinks": ["Beer", "Champagne", "Tequila", "Coffee", "Mojito", "Red wine", "Gin and tonic", "Milkshake", "Jägermeister", "Energy drink"],
  "Places": ["Beach", "Airport", "Hospital", "Casino", "Gym", "Library", "Nightclub", "Prison", "Church", "Zoo", "Sauna", "IKEA", "Ski resort"],
  "Animals": ["Penguin", "Giraffe", "Shark", "Kangaroo", "Octopus", "Elephant", "Moose", "Flamingo", "Snake", "Sloth", "Seagull"],
  "Jobs": ["Pilot", "Dentist", "Firefighter", "Chef", "Teacher", "Police officer", "Bartender", "DJ", "Astronaut", "Plumber"],
  "Things": ["Umbrella", "Toothbrush", "Guitar", "Candle", "Mirror", "Backpack", "Scissors", "Pillow", "Sunglasses", "Lighter", "Remote control"],
  "Sports": ["Football", "Golf", "Boxing", "Tennis", "Skiing", "Bowling", "Surfing", "Darts", "Ice hockey", "Beer pong"],
  "Party": ["Hangover", "Karaoke", "Birthday", "Wedding", "Taxi", "Bouncer", "Selfie", "Shot glass", "Dance floor", "Pregame"],
  "Movies & TV": ["Titanic", "Harry Potter", "Shrek", "Star Wars", "James Bond", "Batman", "Friends", "The Lion King", "Squid Game"]
};
export const IMP_SIPS = 3; // each civilian, when the Impostor wins
export function newImpostor() {
  const g = S.game, all = [];
  Object.entries(IMP_WORDS).forEach(([cat, ws]) => ws.forEach(w => all.push([cat, w])));
  // No repeats within a night until the list runs out.
  if (!g.impUsed) g.impUsed = [];
  let pool = all.filter(x => !g.impUsed.includes(x[1]));
  if (!pool.length) { g.impUsed = []; pool = all; }
  const [cat, word] = pool[Math.floor(Math.random() * pool.length)];
  g.impUsed.push(word);
  const imp = g.order[Math.floor(Math.random() * g.order.length)];
  // A civilian always gives the first clue, so the Impostor has something to go on.
  const civs = g.order.filter(pid => pid !== imp);
  const first = civs.length ? g.order.indexOf(civs[Math.floor(Math.random() * civs.length)]) : 0;
  return { phase: "intro", cat, word, imp, first, seat: 0, show: false, accused: null, caught: false, guessed: false, win: null };
}
export function impostorEnd(m, win) {
  const g = S.game, logFrom = g.log.length;
  m.win = win; m.phase = "result";
  ev("impostor", { pid: m.imp, win, caught: m.caught, guessed: m.guessed, accused: m.accused, word: m.word });
  if (win) g.order.filter(pid => pid !== m.imp).forEach(pid => logDrink(pid, "sip", IMP_SIPS, "The Impostor: " + player(m.imp).name + " won"));
  else logDrink(m.imp, "shot", 1, "The Impostor: caught");
  // Voting out an innocent costs them a shot too.
  if (!m.caught && m.accused !== "none") logDrink(m.accused, "shot", 1, "The Impostor: wrongly accused");
  setTimeout(() => fx.drinks(logFrom), 900);
  fx.sound(win ? "lose" : "win");
  if (!win) setTimeout(fx.confetti, 200);
}
export function impostorAct(act, data) {
  const m = S.game.imp, n = S.game.order.length;
  if (!m) return;
  if (act === "im-start" && m.phase === "intro") { m.phase = "roles"; m.seat = 0; m.show = false; fx.sound("tap"); }
  if (act === "im-show" && m.phase === "roles") { m.show = true; fx.sound("flip"); fx.buzz(30); }
  if (act === "im-hide" && m.phase === "roles" && m.show) {
    m.show = false; m.seat += 1;
    if (m.seat >= n) { m.phase = "clues"; fx.sound("whistle"); } else fx.sound("tap");
  }
  if (act === "im-vote" && m.phase === "clues") { m.phase = "vote"; fx.sound("whistle"); }
  if (act === "im-accuse" && m.phase === "vote") { m.accused = m.accused === data.id ? null : data.id; fx.sound("tap"); }
  if (act === "im-reveal" && m.phase === "vote" && m.accused) {
    m.caught = m.accused === m.imp;
    if (m.caught) { m.phase = "guess"; fx.sound("crown"); } else impostorEnd(m, true);
  }
  if (act === "im-guess" && m.phase === "guess") { m.guessed = data.k === "1"; impostorEnd(m, m.guessed); }
  if (act === "im-again" && m.phase === "result") { if (S.game.solo) S.game.round += 1; S.game.imp = newImpostor(); S.game.imp.phase = "roles"; fx.sound("whistle"); }
}
