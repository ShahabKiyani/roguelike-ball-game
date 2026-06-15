# First Game

`First Game` is a small browser game written in TypeScript and rendered with the HTML5 canvas.

## About the Game

The game is called `Square Dash`.

- You control a glowing square.
- Collect gold circles to gain points and extra time.
- Avoid red circles because they reduce your score and timer.
- Try to survive until the clock runs out with the highest score possible.

## Controls

- `W`, `A`, `S`, `D` to move
- Arrow keys to move
- `Restart` button to reset the game

## Project Structure

- [index.html](/Users/shahab/Desktop/Projects/typescript/firstgame/index.html) sets up the page and loads the game.
- [src/game.ts](/Users/shahab/Desktop/Projects/typescript/firstgame/src/game.ts) contains the TypeScript game logic.
- [src/styles.css](/Users/shahab/Desktop/Projects/typescript/firstgame/src/styles.css) contains the UI styling.
- [dist/game.js](/Users/shahab/Desktop/Projects/typescript/firstgame/dist/game.js) is the compiled JavaScript output.

## Install Dependencies

Run this once from the project folder:

```bash
npm install
```

## Build the Game

Compile the TypeScript source into JavaScript:

```bash
npm run build
```

If you want TypeScript to rebuild automatically while you work:

```bash
npm run watch
```

## Run the Game

Because this is a browser game, serve the folder with a simple local web server.

From the project folder, run:

```bash
python3 -m http.server 8000
```

Then open this URL in your browser:

```text
http://localhost:8000
```

## Typical Workflow

1. Run `npm install` once.
2. Run `npm run build` after changing `src/game.ts`.
3. Run `python3 -m http.server 8000`.
4. Open `http://localhost:8000`.

## Notes

- The game stores your best score in the browser using `localStorage`.
- If you update the TypeScript source, rebuild before refreshing the browser unless `npm run watch` is already running.
