# Quattro Rally

A Three.js arcade dirt racer inspired by the fixed-camera racing of Ivan “Ironman” Stewart’s Super Off Road. Four original, procedurally modeled Audi Sport Quattro-inspired cars salute Omarchy Quattro in amber, sage, coral, and lavender. An unofficial fan tribute; no original game assets are used.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` creates a static production build in `dist`; `npm run preview` serves that build. Requires WebGL 2. Fonts have local fallbacks; all game geometry is generated locally.

## Play

- Arrow keys or WASD: accelerate, brake/reverse, and steer relative to the car.
- Space: nitro (recharges when released).
- P / Escape: pause; R: restart; Enter: start / race again.
- Touch controls appear on narrow screens.
- Sound button enables synthesized engine audio.

Finish three forward laps against three AI opponents. Tire barriers and collisions slow you down; two dirt jumps send the cars airborne. Your best completion time is saved locally. Switching tabs pauses the race.

`npm test` checks lap crossing, reverse-lap protection, angle wrapping, and timing. Physics runs at a fixed 60 Hz. Rendering uses Three.js's recommended [setAnimationLoop](https://threejs.org/docs/pages/WebGLRenderer.html).
