# Robot Survival Game

This is a 3D boxman-vs-robot survival game built with Next.js, React, and Three.js (via @enable3d/phaser-extension). Control a boxman and fight against Robot in a dynamic arena with real-time physics and AI-driven actions.

## Features
- 3D game world rendered in-browser.
- Play as a robot: move, punch, and survive against Robot.
- Robot is AI-controlled and will attack you.
- Health, attack, and respawn mechanics for both characters.
- Grid-based position display and controls.
- Modern, interactive UI with keyboard and button controls.

## Controls
just prompt it

## How to Run

### Prerequisites
- Node.js (recommended: use [bun](https://bun.sh/) or [pnpm](https://pnpm.io/))
- Install dependencies:
  ```fish
  bun install # or pnpm install
  ```
- Copy `.env.example` to `.env` and configure as needed (optional for local dev)

### Run the App Locally
```fish
bun run dev # or pnpm dev
```
The app runs at http://localhost:3000

### Build for Production
```fish
bun run build # or pnpm build
bun run start # or pnpm start
```

## Docker Usage

1. Build the Docker image:
    ```fish
    docker build -t robot-survival-game .
    ```
2. Run the container:
    ```fish
    docker run -d \
      -p 3000:3000 \
      --env-file .env \
      --name robot-survival-game \
      robot-survival-game
    ```

## Project Structure
- `src/app/page.tsx`: Main game logic and UI
- `src/app/api/`: API routes for chat and robot AI
- `public/`: Static assets (models, textures)

## Credits
- Built with [Next.js](https://nextjs.org/), [React](https://react.dev/), [Three.js](https://threejs.org/), and [@enable3d/phaser-extension](https://github.com/enable3d/enable3d).

---

Enjoy battling robot and surviving as long as you can!