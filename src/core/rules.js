export const SUITS = [{ s: "♠︎", red: false }, { s: "♥︎", red: true }, { s: "♦︎", red: true }, { s: "♣︎", red: false }];
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
export const ACTIONS = {
  none: "Nothing to log",
  self: "Drawer drinks",
  give: "Drawer gives out sips",
  suit: "Red: give out · Black: drink",
  pick: "Pick who drinks",
  all: "Everyone drinks",
  mate: "Pick a drinking mate",
  role: "Drawer gets a role (losers drink)",
  makerule: "Make a rule (breakers drink)",
  dictator: "Dictator"
};

// The crew's house rules. The sips box sets the default amount; it can be adjusted on each draw.
export const DEFAULT_RULES = {
  A: { name: "Waterfall", text: "Everyone keeps drinking until the person who picked the card stops. Who knows how long you'll be going for!", action: "all", sips: 3 },
  "2": { name: "Give or drink 2", text: "Red suit: choose someone to drink 2 sips. Black suit: you drink 2 sips.", action: "suit", sips: 2 },
  "3": { name: "Give or drink 3", text: "Red suit: choose someone to drink 3 sips. Black suit: you drink 3 sips.", action: "suit", sips: 3 },
  "4": { name: "Give or drink 4", text: "Red suit: choose someone to drink 4 sips. Black suit: you drink 4 sips.", action: "suit", sips: 4 },
  "5": { name: "Give or drink 5", text: "Red suit: choose someone to drink 5 sips. Black suit: you drink 5 sips.", action: "suit", sips: 5 },
  "6": { name: "Thumb Master", text: "Once, whenever you like, put your thumb on the table. Everyone must follow, and the last one drinks. Then your power is used up.", action: "role", sips: 2, once: true },
  "7": { name: "Heaven", text: "Point your finger at the sky. Whoever is last must drink.", action: "pick", sips: 2 },
  "8": { name: "Mate", text: "Choose a drinking mate. Whenever one of you drinks, the other drinks too. Max 2 mate pairs: a new pair ends the oldest.", action: "mate", sips: 0 },
  "9": { name: "Rhyme", text: "Say a word, like fog. The next person rhymes it (dog) and it goes round the circle until someone messes up and drinks.", action: "pick", sips: 2 },
  "10": { name: "Categories", text: "Pick a category, like football. Go round the circle naming things in it. Whoever messes up drinks.", action: "pick", sips: 2 },
  J: { name: "Make a Rule", text: "Make up a rule everyone must follow for the whole game, you included. Like: only drink with your left hand. Break it and you drink.", action: "makerule", sips: 1 },
  Q: { name: "Question Master", text: "You're the Question Master. Anyone who answers one of your questions drinks 2 sips. You keep the title until a new Queen is pulled.", action: "role", sips: 2 },
  K: { name: "Dictator", text: "Everyone must do what the Dictator says until a new King is pulled, or someone challenges you with the dice.", action: "dictator", sips: 0 }
};
export const FREQ_CHOICES = [[0, "Never"], [8, "Roughly every 8 cards"], [10, "Roughly every 10 cards"], [13, "Roughly every quarter of the deck"], [17, "Roughly every 17 cards"], [26, "Once, around halfway"]];
