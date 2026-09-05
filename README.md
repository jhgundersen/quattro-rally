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

## Production deployment

Live at **https://quattro.jonh.no**. Every push to `main` runs `.github/workflows/deploy.yml`: install locked dependencies, test, build, upload `dist`, and compare the live HTTPS index with the build. You can also run it manually from GitHub Actions. Deployments are serialized.

The existing `/root/website` Docker Compose nginx serves a read-only mount of `/srv/quattro` at `/www/quattro`. Configuration is installed at `/root/website/config/nginx/quattro.conf`; its source is `deploy/quattro-https.conf`. The HTTP-only configuration is retained for initial certificate bootstrapping. Existing Certbot renewal and nginx reload loops maintain the dedicated `quattro.jonh.no` certificate.

GitHub repository configuration:
- Secret `DEPLOY_KEY`: dedicated SSH key, restricted server-side to write-only rsync in `/srv/quattro`.
- Secret `DEPLOY_KNOWN_HOSTS`: pinned server host keys.
- Variable `DEPLOY_HOST`: server IP address.

The `quattro-deploy` account has no general SSH command access. Its root-owned authorized keys live outside the upload directory at `/var/lib/quattro-deploy/.ssh/authorized_keys`. The game's files are separate from the main website's deployment directory. To roll back, revert the relevant commit on `main`; the workflow republishes the previous version.

## Tracks and terrain

Choose a course before racing, or use **Change track** to leave the current race. Every course has its own local personal best. All races remain three laps with four Quattros.

| Course | Biome | Difficulty | Hazards |
| --- | --- | --- | --- |
| The Gravel Pit | Quarry | 1/4 · Rookie | Wide gravel bends, two jumps, mud and a boulder |
| Black Pine Run | Forest | 2/4 · Clubman | Shallow water crossing, mud, solid trees and a fallen log |
| Red Rock Scramble | Desert | 3/4 · Pro | Deep sand, narrower bends, boulders and three jumps |
| Frostbite Pass | Alpine | 4/4 · Expert | Low-grip ice, a meltwater pool, trees and rocks |

Difficulty combines road width, course geometry, surface hazards and opponent target speed. The AI shares the player's terrain and collision physics and steers around solid obstacles. Water and mud increase drag; sand reduces acceleration; ice allows long slides. Airborne cars clear surface hazards and low obstacles, but trees remain solid. Colored spray and an on-track label identify the surface under your car.

Course definitions live in `src/tracks.js`, procedural scenery in `src/world.js`. Track changes dispose their old GPU geometry, materials and textures. Terrain/collision tests also check that course sections do not overlap and that obstacles leave a passable lane.
