# Quattro Rally

A Three.js arcade dirt racer inspired by the fixed-camera racing of Ivan “Ironman” Stewart’s Super Off Road. Four original, procedurally modeled Audi Sport Quattro-inspired cars salute Omarchy Quattro in amber, sage, coral, and lavender. An unofficial fan tribute; no original game assets are used.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` creates a static production build in `dist`; `npm run preview` serves that build. Requires WebGL 2. Fonts have local fallbacks; all game geometry is generated locally.

The fixed orthographic camera uses an isometric view (45° azimuth, 35.3° elevation). Framing fits each course, including barriers, jumps and the start banner, when the track or viewport changes.

## Play

- Arrow keys or WASD: accelerate, brake/reverse, and steer relative to the car.
- Space: nitro (recharges when released).
- P / Escape: pause; R: restart; Enter: start / race again.
- Touch controls appear on narrow screens.
- Sound defaults to on; the sound button mutes both music and synthesized engine audio. Starting a race unlocks browser audio playback.

You always drive the amber quattro, and you always start last. Ahead of you are Ryan and Bjarne, and on pole is DHH in Omarchy green over Tokyo-night ink — quick enough that beating him takes a clean run rather than a tidy one. Finish three forward laps against the three of them. Cars throw up dirt as they go — thick enough on the loose stages that a pack of them can briefly smear the track behind them, and heaviest when a car lands from a jump — and lay tyre marks that linger for most of a lap, in whatever the surface gives up — rubber on concrete, churned earth on gravel, sprayed grains in sand. Arena barriers and collisions slow you down; jump sections send the cars airborne. Your best completion time is saved locally. Switching tabs pauses the race. The finish screen celebrates the top three with an animated podium, confetti, and full race results, and the commentary is drawn from pools so no two races read the same. Beat DHH and the whole screen changes: it floods green, the headline lands with a glow, and a winner's track plays instead of the consolation one. Rivals have a 25-second grace period after you finish; remaining racers are marked DNF. Replay or move straight to the next stage. Reduced-motion preferences disable celebration animations.

`npm test` checks lap crossing, reverse-lap protection, angle wrapping, and timing. Physics runs at a fixed 60 Hz. Rendering uses Three.js's recommended [setAnimationLoop](https://threejs.org/docs/pages/WebGLRenderer.html).

## Soundtrack

`public/audio/` contains the three supplied Quattro MP3s. Music starts with the race countdown, continues through the podium, and loops through all three songs. Each new race starts with the next song. Pausing, leaving the race, muting, or switching away from the game pauses playback; resuming continues from the same position. Songs load only when needed.

`src/soundtrack.js` handles playlist playback. Its tests cover track rotation, looping, pause/mute continuity, and retrying browser-blocked playback.

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

| Course | Layout | Difficulty | Hazards |
| --- | --- | --- | --- |
| The Gravel Pit | Horseshoe bowl: long back straight and deep infield U-turn | 1/4 · Rookie | Three jumps, mud and a boulder |
| Black Pine Run | Twin hairpins: outer sweep feeding a folded infield | 2/4 · Clubman | Water crossing, mud, trees and a fallen log |
| Red Rock Scramble | Canyon switchback: parallel straights joined by 180s | 3/4 · Pro | Deep sand, boulders and four jumps |
| Frostbite Pass | Frozen cloverleaf: four lobes with alternating turns | 4/4 · Expert | Ice, meltwater, trees and rocks |
| Maximum Parking | Concrete paperclip: folded parking aisles on an exposed garage deck | 3/4 · Pro | Two ramps, oil slicks and traffic cones |

Difficulty combines road width, course geometry, surface hazards and opponent target speed. The AI shares the player's terrain and collision physics and steers around solid obstacles. Water and mud increase drag; sand reduces acceleration; ice allows long slides. Garage concrete offers more grip, while spilled oil makes the car slide. Airborne cars clear surface hazards and low obstacles, but trees remain solid. Colored spray and an on-track label identify the surface under your car.

Course definitions live in `src/tracks.js`, shared curve geometry in `src/course.js`, driving in `src/physics.js`, and procedural scenery in `src/world.js`. The track selector previews the same curve used by the race. Rounded curves, red-and-white barriers, and direction arrows keep the folded lanes readable. AI lookahead uses distance along the road, plans braking from upcoming curvature, spends nitro on clear straights, and selects passing lanes around slower cars. Four-car simulations finish the original courses roughly 8–19% faster than the previous controller, without changing the shared vehicle forces.

Track changes dispose their old GPU geometry, materials and textures. Tests check minimum corner radii, separation of adjacent lanes, obstacle clearance, and four-driver three-lap simulations on every course using the actual game physics. The original four courses use revision 2 and the garage starts at revision 1, with separate best times; old stored records remain untouched.

### The Bog — Mudlands

The sixth stage is a wet-mud figure eight with an open, ground-level crossing. Boost over the approach ramp to clear crossing traffic; slower cars can collide in the intersection. Deep mud, standing water, reeds and churned banks surround the two loops. Follow the arrows straight through the X: route tracking and the driving boundary stay on your current branch, so turning onto the other loop cannot skip half a lap. Both loops must be driven on each lap.

### Le Mans — Endurance Circuit

The seventh stage compresses the Circuit de la Sarthe into the fixed isometric arena: the Dunlop/Esses approach, two Mulsanne chicanes, Mulsanne corner, Indianapolis/Arnage and the Porsche/Ford return. Wider bends preserve drivable road edges at arcade scale. Asphalt, blue-and-yellow kerbs, a Dunlop footbridge, pits and grandstands distinguish it from the dirt stages; it has no jump ramps. Reference: [ACO's circuit guide](https://www.24h-lemans.com/en/news/24-hours-of-le-mans-the-legendary-spots-on-the-circuit-de-la-sarthe-19372) and the [circuit layout map](https://indiaongo.in/wp-content/uploads/2022/04/circuit-de-la-sarthe-racecourse-layout.jpg).

Dust plumes emit roughly 60% more particles, with greater opacity, more broad billows, longer lifetimes and heavier landing bursts. The bounded 1,400-particle pool still renders in one draw call. Surface density keeps asphalt and concrete mostly clean.
