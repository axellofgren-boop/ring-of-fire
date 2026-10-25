# Ring of Fire 🔥

A party drinking game for the crew, with house rules, mini-games (Horse Race, The Bomb, The Door, The Impostor) and a game-over screen with stats and awards.

**Play it here:** https://axellofgren-boop.github.io/ring-of-fire/

There is nothing to download from an app store. The game is one web page: open the link and play. You can also add it to your phone's home screen so it opens like a normal app and works with no internet.

Player names and scores are saved only on the device you play on. Nothing is uploaded.

---

## Quick start

| I want to play on… | Do this |
| --- | --- |
| A computer | Open the link in Chrome, Edge, Safari or Firefox. Done. |
| An iPhone | Open the link in **Safari**, tap **Share**, then **Add to Home Screen**. |
| An Android phone | Open the link in **Chrome**, tap **⋮**, then **Add to Home screen** or **Install app**. |
| The TV | Run the game on one phone or laptop and mirror its screen to the TV (see below). |

---

## 💻 Playing on a computer

### Option 1: just open the link (easiest)

1. Open https://axellofgren-boop.github.io/ring-of-fire/ in any modern browser (Chrome, Edge, Safari or Firefox).
2. Add your players and start drawing cards.
3. Press **F11** (Windows) or **Ctrl + Cmd + F** (Mac) for full screen, so the browser bars disappear.

A laptop screen is wide, so the game uses its landscape layout automatically: the ring of cards on the left and whose turn it is on the right.

**Install it as an app (optional).** In Chrome or Edge, click the small install icon at the right end of the address bar (a screen with a down arrow), or open the **⋮** menu and choose **Cast, save and share → Install page as app**. It then gets its own window and desktop icon, and works offline.

### Option 2: run it from your own computer (no internet needed)

Use this if the Wi-Fi at the party is bad, or you want your own copy.

1. Download the game: on the GitHub page, click the green **Code** button, then **Download ZIP**, and unzip it. (If you use git: `git clone https://github.com/axellofgren-boop/ring-of-fire.git`.)
2. **Quickest:** double-click `index.html`. It opens in your browser and the whole game works.
3. **Better (if you have Python):** open a terminal in the unzipped folder and run:

   ```
   python3 -m http.server 8000
   ```

   (On Windows it may be `python -m http.server 8000`.) Then open http://localhost:8000 in your browser. Running it this way also turns on the offline cache and the **Install app** option.

   Want phones on the same Wi-Fi to join? Find your computer's local address (for example `192.168.1.20`) and open `http://192.168.1.20:8000` on the phone. Note that "Add to Home Screen" offline mode needs the real https link above, so use this only for playing on the spot.

Press **Ctrl + C** in the terminal to stop the server when you're done.

### Showing a computer on the TV

- **HDMI cable:** plug the laptop into the TV and pick that HDMI input. Most reliable option.
- **Mac → Apple TV or AirPlay TV:** click **Control Centre** (top right) → **Screen Mirroring** → pick the TV.
- **Windows → Miracast TV:** press **Windows + K** and pick the TV.
- **Chrome → Chromecast or Google TV:** open the **⋮** menu → **Cast, save and share → Cast…** → choose the TV. Pick **Cast tab** under Sources.

Then put the browser in full screen.

---

## 📱 Playing on an iPhone

### 1. Add it to your home screen

This is the best way to play: it opens full screen like a real app, and it works without internet once installed.

1. Open **Safari** (it must be Safari, not Chrome or Instagram's built-in browser).
2. Go to https://axellofgren-boop.github.io/ring-of-fire/
3. Tap the **Share** button (the square with an arrow pointing up). On newer iPhones it's at the bottom of the screen; if you can't see it, tap the **⋯** button first.
4. Scroll down and tap **Add to Home Screen**.
5. Leave the name as **Ring of Fire** and tap **Add**.

A 🔥 Ring of Fire icon now sits on your home screen. Always start the game from that icon.

> **Tip:** opening a link someone sent you in Messages or WhatsApp may open a mini browser. Tap the compass or "Open in Safari" button first, then follow the steps above.

### 2. Playing offline

1. Open the app from the home screen **once while you have internet**. That saves the whole game on the phone.
2. After that it works with no Wi-Fi and no mobile data: at the cabin, on the boat, in airplane mode.
3. When you're online again, opening the app picks up the newest version automatically. If you don't see a new change, close the app fully (swipe it away) and open it again.

> **Heads up:** the home-screen app and Safari keep separate save data on iPhone. Pick one (the home-screen app) and stick to it, or your players and scores won't be there.

### 3. Landscape mode and the TV (AirPlay)

The game has a special sideways layout made for TVs: big cards in the middle, the ring on the left and whose turn it is on the right.

1. Open **Control Centre** (swipe down from the top-right corner) and make sure **Rotation Lock** (the padlock with a circle) is **off**.
2. Open Ring of Fire and turn the phone **sideways**. The layout switches to landscape.
3. To show it on the TV: open **Control Centre** again, tap **Screen Mirroring** (two overlapping rectangles), and pick your **Apple TV** or AirPlay TV (most newer Samsung, LG, Sony and Vizio TVs support AirPlay).
4. If the TV shows a code, type it on the phone.
5. Put the phone on the table, and pass it around (or let one person run it) while everyone watches the TV.

To stop mirroring: **Control Centre → Screen Mirroring → Stop Mirroring**.

**No Apple TV?** Use a Lightning or USB-C to HDMI adapter and a cable, which mirrors the phone just the same.

**Keep the screen awake:** for long games, go to **Settings → Display & Brightness → Auto-Lock** and set it to a longer time (or **Never**) for the night. Plug the phone in if you can, since mirroring uses battery.

---

## 🤖 Playing on Android

1. Open **Chrome** and go to https://axellofgren-boop.github.io/ring-of-fire/
2. Tap the **⋮** menu (top right), then **Add to Home screen** or **Install app** and confirm. (Samsung Internet: **☰ → Add page to → Home screen**.)
3. Open it once while online; after that it works offline, just like on iPhone.
4. **Landscape:** turn on **Auto-rotate** in the quick settings (swipe down from the top), then turn the phone sideways.
5. **TV:** swipe down for quick settings and tap **Cast**, **Screen Cast** or **Smart View** (Samsung), then pick your Chromecast, Google TV or smart TV. You can also open the **Google Home** app → your device → **Cast my screen**.

---

## Troubleshooting

- **"Add to Home Screen" is missing on iPhone.** You're not in Safari. Copy the link, open Safari, and paste it there.
- **The game doesn't open offline.** It needs one visit with internet first, from the home-screen icon. Open it online once, wait a few seconds, then try again.
- **It won't turn sideways.** Turn off Rotation Lock (iPhone) or turn on Auto-rotate (Android).
- **My players and scores are gone.** Saved data lives in the browser you played in. Clearing Safari or Chrome history and website data wipes it, and the iPhone home-screen app has its own separate save.
- **I don't see the latest version.** Open the game while online, close it fully, and open it again.
- **The TV picture has black bars.** That's normal for mirroring a phone. Turn the phone sideways to fill more of the TV.

---

## 🛠 For whoever changes the game

The game you play is the single file `index.html`. Don't edit it by hand: it is built from the small files in `src/`.

| Folder | What lives there |
| --- | --- |
| `src/core/` | The rules: game state and saving, drinks and mates, the card flow, halftime, mini-game rotation, awards. No screen code, so it can be tested on its own. |
| `src/minigames/<game>/` | One folder per mini-game: `logic.js` (its rules), `view.js` (its screens), `style.css` (its look). |
| `src/ui/` | Drawing the screens, taps and buttons, sounds, pop-ups, the cogwheel sheets. |
| `src/styles/` | The shared look. `styles/layout/` holds one file per form factor: `phone-portrait.css`, `landscape.css` (shared by the next two), `phone-landscape.css` and `desktop.css` (laptop, desktop, TV). |
| `tests/unit/` | Game-logic tests (no browser). |
| `tests/e2e/` | A tour through every screen in a real browser, with layout checks and screenshots. |

The three layouts switch on the screen's shape:

- **Phone portrait**: taller than wide.
- **Phone landscape**: wider than tall, up to 600px high. The main way the game is played, often mirrored to a TV.
- **Desktop / TV**: wider than tall and more than 600px high.

To work on it you need [Node.js](https://nodejs.org) 22 or newer:

```
npm install                          # once
npx playwright install chromium      # once, the browser the checks use
npm run build                        # rebuild index.html and sw.js after changing src/
npm test                             # everything below, as GitHub runs it on every pull request
npm run test:unit                    # game-logic tests
npm run test:e2e                     # layout checks at 9 screen sizes
npm run screens                      # screenshots of every screen at the 3 main sizes, into screens/
```

Commit the rebuilt `index.html` and `sw.js` with your change; the checks fail if they are out of date.

Drink responsibly, look after each other, and never drink and drive. 🍻
