# Quattro Rally — session knowledge

Distilled on 2026-09-05. This records project context and verified session outcomes; check the current code and configuration before relying on version-specific paths.

## Purpose and user preferences

- Build a Three.js arcade racer inspired by Ivan “Ironman” Stewart’s **Super Off Road**, with four differently colored Audi Sport Quattro-inspired rally cars as a salute to **Omarchy Quattro**.
- Use original procedural models and scenery. The liveries are amber, sage, coral, and Omarchy green.
- The user wants compact, recognizably different arcade arena layouts: folded infields, hairpins, parallel straights, jumps, and obstacles. Earlier courses looked too much like variations of one wavy oval; changing scenery alone does not satisfy this requirement.
- Preserve the **fixed isometric view** and visibility of the whole course. The user specifically corrected the earlier steep overhead view.

## Project and commands

- Local project: `/home/jonh/jonh.no/quattro-rally`.
- Repository: https://github.com/jhgundersen/quattro-rally
- Production: https://quattro.jonh.no
- Stack: vanilla JavaScript ES modules, Three.js, Vite; static build, no application backend. Requires WebGL 2.
- `npm ci` installs locked dependencies; `npm run dev` starts Vite; `npm run build` produces `dist/`; `npm run preview` serves the build.
- Validate code changes with `npm test`, `npm run build`, and `git diff --check`. CI uses Node 22. Local Node 26 can summarize tests by file rather than by individual test.
- A Vite warning about a JavaScript chunk exceeding 500 kB has occurred on successful builds; distinguish it from a build failure.

## Gameplay and architecture

Races have one player, three AI opponents, and three laps. Controls: WASD/arrows to drive, Space for rechargeable nitro, P/Escape to pause, R to restart, Enter to start/replay. Narrow screens have touch controls. Engine audio is synthesized; sound defaults to on and the race-start interaction unlocks playback. The supplied Quattro MP3 playlist accompanies races and the podium. Losing focus pauses the race.

| File | Responsibility |
| --- | --- |
| `src/main.js` | Renderer, isometric camera/framing, car models, UI, input, audio, persistence, and game loop |
| `src/tracks.js` | Course definitions, difficulty, surface behavior, and solid obstacles |
| `src/course.js` | Shared curve geometry, course queries, and selector previews |
| `src/world.js` | Procedural terrain, barriers, arrows, jumps, scenery, and resource disposal |
| `src/physics.js` | Shared player/AI driving, AI controls, and car collisions |
| `src/race.js` | Lap progression, heading wrapping, time formatting, and finish-order sorting |
| `src/drivers.js` | Four driver identities, liveries, and original SVG portraits |
| `src/soundtrack.js` | Lazy MP3 playback, playlist rotation, pause/resume, and autoplay retry |
| `index.html`, `src/style.css` | Page, race HUD, overlays, course cards, and responsive controls |

- Physics uses a fixed 60 Hz step; rendering uses `renderer.setAnimationLoop`.
- Camera position `(90, 90, 90)` looking at the origin gives 45° azimuth and approximately 35.3° elevation. Orthographic framing fits each course in camera space, including road margins, airborne cars, banners, and relevant scenery. Recalculate on track changes and viewport resize.
- Best times are local and separated by course revision: `quattro-best-${track.id}-v${track.revision}`. The original four layouts are revision 2; the garage is revision 1. Increment revisions when layout changes invalidate previous times; retain older stored records.
- `window.quattro` exposes read-only telemetry such as track, state, race time, cars, and draw calls.

## Courses and layout lessons

| ID / course | Biome and difficulty | Layout and hazards |
| --- | --- | --- |
| `gravel` / The Gravel Pit | Quarry, 1/4 Rookie | Horseshoe bowl, long back straight, deep infield U, three jumps, mud, boulder |
| `forest` / Black Pine Run | Forest, 2/4 Clubman | Twin hairpins, folded infield, water crossing, mud, trees, fallen log |
| `desert` / Red Rock Scramble | Desert, 3/4 Pro | Canyon switchback, parallel straights joined by 180° turns, sand, rocks, four jumps |
| `alpine` / Frostbite Pass | Alpine, 4/4 Expert | Frozen cloverleaf, four lobes, alternating turns, ice, meltwater, trees, rocks |
| `garage` / Maximum Parking | Parking garage, 3/4 Pro | Concrete paperclip, folded aisles, oil slicks, cones, two ramps, parking bays and parked cars |

- Difficulty combines geometry, narrowing road width, hazards, and increasing AI target speed.
- The road uses a custom periodic cubic B-spline (`ArenaCurve`). Earlier Catmull–Rom curves produced tight bends where inner road edges and barriers folded or crossed. Preserve smooth curvature and adequate lane separation when editing control points.
- Course previews use the same curve as rendering and physics. Do not maintain separate approximate preview layouts.
- Geometry tests require minimum corner radius greater than `width / 2 + 0.85` and adequate clearance between distant parts of the course (`width + 1.7`). Obstacles must leave passable lanes.
- AI lookahead is measured in world distance, not a fraction of the whole lap. Fractional lookahead overshot corners on longer folded circuits. AI brakes for upcoming curvature and avoids obstacles while sharing player physics.
- Water/mud add drag, sand reduces acceleration, and ice reduces grip. Airborne cars clear surface patches and sufficiently low obstacles; trees remain solid.
- Dispose old geometries, materials, and textures when switching courses.

## Verification

- `src/race.test.js` covers forward/reverse lap crossing, reverse-lap farming prevention, angle wrapping, and timing.
- `src/tracks.test.js` covers surfaces, obstacle collisions and clearance, difficulty, and course geometry.
- `src/physics.test.js` runs four drivers for three laps on every course using production physics, with completion within 180 simulated seconds, finite coordinates, progress continuity, and working jumps.
- `src/physics.test.js` also time-trials the ace against a standard rival on every course. The gravel pit is the tuning yardstick: the user laps it in about 35 seconds, so DHH is held to 28-34.5 seconds there — clearly quicker, still catchable on a clean run. Solo pace is roughly 32s gravel, 53s forest, 49s desert, 38s alpine, 50s garage; the standard AI runs 52/77/66/58/66.
- For course or camera changes, also visually inspect all courses in Chromium. Check full-course framing, distinct silhouettes, readable lanes/barriers, scenery clearance, and narrow-screen HUD layout.
- Previous narrow-screen HUD overlap was fixed; preserve room for timer and nitro.
- The latest isometric-camera change passed tests/build and deployed successfully. Gravel and alpine framing were visually checked in Chromium. Simulation tests are not evidence of a complete human-driven browser race.

## Deployment and server

- Every push to `main` runs `.github/workflows/deploy.yml`; manual `workflow_dispatch` is also available. It installs dependencies, tests, builds, uploads `dist/`, and compares the served HTTPS index with the build. Deployments are serialized.
- GitHub configuration: secrets `DEPLOY_KEY` and `DEPLOY_KNOWN_HOSTS`; variable `DEPLOY_HOST`. Never put their values or SSH passphrases in documentation.
- Existing SSH alias: `ssh jonh`, root on `188.166.97.167`. DNS for `quattro.jonh.no` was added by the user and deployment was verified.
- Existing Docker Compose stack: `/root/website/docker-compose.yml`. Its nginx serves `/srv/quattro` through the read-only mount `/srv/quattro:/www/quattro:ro`.
- Keep game uploads separate from the main website's `/root/website/data`; the main site's deployment can delete files in its own destination.
- Installed nginx vhost: `/root/website/config/nginx/quattro.conf`. Repository source: `deploy/quattro-https.conf`; `deploy/quattro-http.conf` is the certificate bootstrap configuration.
- Dedicated certificate lives under `/root/website/config/certbot/conf/live/quattro.jonh.no/`. Existing Certbot renewal and nginx reload loops maintain SSL; HTTP redirects to HTTPS. Preserve the other applications in this shared stack.
- Deployment user `quattro-deploy` is restricted to write-only rsync into `/srv/quattro` using a forced `rrsync` command. Root-owned authorized keys are outside that upload directory at `/var/lib/quattro-deploy/.ssh/authorized_keys`; keep this separation.
- Routine releases require pushing the code, not manually changing the server. Inspect GitHub Actions with `gh run list` and `gh run watch <id> --repo jhgundersen/quattro-rally --exit-status`. Roll back with a revert on `main`.
- If the SSH key needs unlocking, use the local SSH agent (`ssh-add ~/.ssh/id_ed25519`), never a passphrase in chat or source. Sandbox network failures can resemble authentication failures; verify the cause before replacing credentials.

## Garage, drivers and podium update

- Drivers are Player (amber, you), Ryan (sage), Bjarne (coral), and DHH (Omarchy green `#9ece6a` over Tokyo-night ink `#1a1b26`, sampled from the Omarchy wordmark). Ryan and Bjarne are drawn from the photos the user supplied: glasses and a goatee, and a shaved head with grey stubble and one raised eyebrow.
- There is no driver picker. The player is always `PLAYER` (car index 0, amber) and `GRID` orders the start by `skill`, so DHH leads away and the player is last with work to do. `#lineup` on the start overlay just shows that order. Portraits carry no number badge.
- `skill` drives everything about rival pace: DHH 2.2 (`ace: true`), Ryan 1.55, Bjarne 1.4. It scales corner speed, target pace, nitro economy (regen by `skill²`, burn by `1/skill`), boost gating, lookahead and a racing line that reaches for the inside of the next bend. Cars without a `skill` keep the old behaviour exactly, so the standard-AI tests still describe them.
- Three changes did most of the work and are easy to undo by accident: corner speed above skill 1 is capped at `2.4/curvature` (the steering rack yaw-rates out at 2.15 rad/s, and a little slide past that is all they can carry) which made him faster *and* stopped him running wide; skilled drivers look `1.4×` further ahead, worth ~2s a race on the tight courses; and while passing they look `2.2×` ahead so the move is a drift across the road instead of a jink that scrubs speed and cuts the nitro. Before that last one the ace lost ~6s a race to traffic and finished behind Ryan.
- Portraits sit in a strip above the course to avoid hiding the road.
- `src/trail.js` lays tyre marks: one ribbon mesh per car (two wheel-wide strips, vec4 vertex colours) sampled every 0.8 m and faded over 11 s, so the marks stay for most of a lap for one draw call each. `MARK_COLORS` gives every surface its own mark — rubber on concrete, churned earth on gravel and mud, sprayed grains in sand, a wet smear on water and ice. A hop of more than four samples' spacing closes the old ribbon with two zero-alpha marks and opens a new one, which is what keeps a jump or a grid reset from dragging a streak across the arena. Strength rises with lateral slip and with nitro.
- `src/dust.js` is the thrown-up dirt: one `THREE.Points` cloud for the whole field (one draw call), a data-built soft disc for the sprite, and a small `ShaderMaterial` because points need per-particle alpha and size. Vertex colours are in the working space, so the fragment shader ends with `#include <colorspace_fragment>` — without it the cloud renders too dark. `setScale()` converts world-sized puffs to pixels and must be refreshed in `resize()`, since the orthographic framing changes per course. `DUST_DENSITY` decides how much each surface gives up: sand throws the most, concrete and ice almost nothing, so the parking garage stays clean. `kickUpDust()` in `main.js` runs a per-car budget that grows with speed, slip and nitro, mixes in wide slow puffs that can briefly hide the road, and saves a heavy billow for the moment a jumping car lands. Puff radii are in metres and have to be big — 1.5-6 m — because the camera fits the whole arena into a few hundred pixels (`setScale` lands around 6-12 px per world unit), and a metre-wide puff is invisible at that zoom. That was the whole bug the first time round: the cloud was spawning and updating correctly, just far too small to see.
- `src/messages.js` holds every line the race says out loud, in pools that are picked from per race: status bar, grace period, podium blocks, and headlines by finishing position. Driver `quips` are pools too. `resultTitle(rank, beatAce)` is the one rule worth knowing: beating the ace outranks the finishing position.
- Beating DHH (he has not finished when the player crosses) sets `is-triumph` on `#results`: a green flood, a glow behind the title, staggered fade-ins, denser green-and-gold confetti — and `soundtrack.finale(true)` swaps in `quattro-winner.mp3`. Losing plays `quattro-not-winner.mp3`. Both are one-offs; `beginRace()` puts the playlist back. Reduced motion keeps the colours and drops the animation.
- After the player finishes, `finishing` continues rival physics for up to 25 seconds. The podium updates as rivals finish, then `finished` freezes results; unfinished cars display DNF. `paused-finishing` preserves this phase on blur/pause. The HUD freezes the player's completion time.
- Results use finish time for finishers and progress for unfinished cars. Replay and next-stage actions reset the results screen. CSS animations respect reduced motion.
- Garage concrete is a base surface; oil is a low-grip patch. Course geometry tests and four-car simulations cover all five courses, including competitive pace limits.
- AI samples curvature at multiple distances, budgets braking distance, uses nitro on straights, and picks passing lanes. Before/after four-car simulations showed roughly 8–19% shorter race times on the original courses; this does not establish human race difficulty.
- Chromium QA checked all five course views, mobile HUD/results, a complete simulated garage race, winner/waiting/DNF results, replay and next stage. Temporary QA controls were removed. This was not a complete human-driven race.

## Soundtrack update

- Supplied downloads `Quattro #1.mp3`, `Quattro #2.mp3`, and `Quattro #3.mp3` were copied unchanged to `public/audio/quattro-1.mp3` through `quattro-3.mp3`. Source downloads were preserved.
- Sound defaults to on. The existing sound button controls music and engine audio together, with matching accessible labels and pressed state. Race start/resume provides browser user activation.
- The playlist advances when a song ends and wraps; each new race starts with the next song. Music continues during results, pauses on race pause/mute/blur/hidden tabs, and stops in course selection. Resuming preserves position. No MP3 preload before racing.
- Playlist tests cover looping, race rotation, pause continuity, and rejected playback recovery. Chromium verified actual MP3 playback, pause/resume, mute/unmute, and song rotation.

## Mudlands crossover update (2026-09-06)

- Sixth course: `bog` / The Bog, revision 1, difficulty 3, a figure eight with a ground-level crossing at route positions .25 and .75. A ramp at .225 lets a boosted car clear grounded crossing traffic; a slow approach remains vulnerable.
- `wetMud` is the entire road's base surface, with deeper `mud` patches and standing water. Mud banks, reeds and waterlogged infields define the biome.
- `createCourse().nearest(x,z,previous)` restricts crossover cars to the current branch within 12 metres of route distance. All physics/AI/progress queries pass `c.t`; scenery keeps the global nearest query. The driving boundary prevents taking the other branch at the X, including airborne attempts. Do not remove this distinction or use global nearest for crossover lap progress.
- Declared `crossings` open the visual barriers and allow geometric overlap only inside their radius. `src/crossover.test.js` covers branch continuity, reverse/lap wrap, ground/air shortcut attempts, and actual boosted versus slow crossing clearance and collisions.
- Six-stage selector uses six desktop columns, three at medium width and two on mobile. Tests/build/diff checks passed; Chromium checked all course framing and Bog mobile selector/HUD. Full production-lineup simulation completed; this was not a human-driven browser race. Changes are local until released.

## Le Mans and denser dust (2026-09-06)

- Seventh course `lemans` / Le Mans, revision 1: asphalt, width 7.2, no jumps or road obstacles. A compressed Circuit de la Sarthe outline retains two Mulsanne chicanes, Mulsanne corner, Arnage and the Porsche/Ford return. Geometry tests retain the same minimum-radius/clearance rules. Physics tests require grounded driving for tracks without jumps.
- Procedural pits, Dunlop footbridge, grandstands and blue/yellow kerbs distinguish it. `createWorld` returns `framingPoints` for outlying scenery; camera framing includes these so pits stay visible on mobile. `accent` optionally overrides road colour for readable selector previews.
- Dust now emits roughly 60% more particles, with stronger opacity, 45% broad billows, longer life and heavier landing bursts. Main pool is bounded at 1,400, still one draw call. Asphalt uses low density and dark rubber marks.
- Seven-stage selector uses four columns on desktop (last card spans two), three at medium widths, two on mobile (last card spans both). Tests/build/diff checks passed; Chromium inspected stronger gravel dust and Le Mans desktop/mobile framing. Existing Bog work is preserved. No release performed.

## Le Mans corner revision (2026-09-06)

- Le Mans is now revision 2. Its control polygon spans more of the board, with deep Mulsanne S-bends and a pronounced Porsche/Arnage return instead of shallow kinks. Lap distance increased from roughly 250 to 333 world metres; prior best-time records remain under revision 1.
- Full geometry, four-car race and ace-pace tests pass with existing limits. Build/diff checks pass. Desktop and mobile framing were visually checked in Chromium; fixed isometric view is retained.

## Daytona banking (2026-09-06)

- Eighth course `daytona`, revision 1: 12 m wide asphalt tri-oval, 31° end turns, 18° front stretch and 6° backstretch with smooth transitions. Original procedural pits, grandstands, Lake Lloyd, outside retaining wall and raised lane stripes. No jumps/obstacles.
- `createCourse` exposes `bankAngle(t)`, `roadHeight(t,lane)` and `roadFrame(x,z,previous)`. `at()` includes road elevation, while route samples/tangents remain planar for lap distance and steering. All older courses return zero road height.
- Physics projects gravity down the bank. `syncModels` aligns Daytona cars to the road normal and raises the player marker; other courses retain their previous pose. Camera bounds include both raised road edges plus car clearance.
- Road ribbons use point.y; barriers and finish tiles follow road elevation. Tyre sampling accepts an optional height callback, storing per-vertex heights so both strips follow the bank. Dust originates at road elevation.
- `banking.test.js` checks actual slopes, continuity, car/mesh height agreement, downhill gravity, flat-course preservation and tyre-strip elevations. Full tests/build/diff checks passed. Chromium checked all eight course views and Daytona mobile framing; simulation is not a human-driven full race. No deployment performed.

## Daytona bowl and turned layout (2026-09-06)

- A road banked at 31° and tilted away from a camera 35.3° above the ground is nearly edge-on: the last turn rendered at a 4.3° grazing angle and effectively vanished. `rotation:-45` on the track turns the layout so the long axis lies across the screen and both turns face the camera side-on. Worst grazing angle is now 10.8°, and the oval fills the widescreen frame about 11% larger. Measure the grazing angle before changing this figure.
- `createCourse` rotates the control points; `bankAngle` converts back, so the 31/18/6° profile stays authored in the axis-aligned frame. Any banked layout added later should be drawn square and turned with `rotation`.
- Three separate faults made the raised road look like it was floating, and all three had to go before it read as solid. Do not treat this as a matter of colour or slope alone.
  1. `sun.shadow.camera` was a fixed `±65 x ±50` box. Any course reaching past it lost its shadows part-way, leaving straight-cut shadow edges lying on the grass, detached from the geometry. `fitShadows()` now sizes the frustum from the course radius (`+24` banked, `+14` otherwise) and runs on load and on every track change. Re-check it before enlarging any course.
  2. The apron crest sat at the barrier lane, `.85` m outboard of the road edge, so an open slot ran the whole lap under the wall and showed daylight beneath the road. A shoulder ribbon from the crest to the road edge closes the surface; it must stay continuous: infield, inner verge, road, shoulder, outer bank, plinth, ground.
  3. A grass slope alone, in the ground colour, gives the eye no line to read the mass against. The outer bank now falls to a `1.1` m retaining plinth in `track.rock`, whose foot draws a hard edge on the ground. That edge is what makes the speedway sit on the board.
- Bank faces use `side: THREE.DoubleSide`; the inner and outer skirts wind in opposite directions, so single-sided material leaves one of them invisible. The ground plate grows to 140x128 for banked courses; the footprint including bank and plinth reaches about ±63 m.
- Daytona's infield, pits, grandstands and ground decals live in an `infield` group that carries the same turn, so they stay square to the oval. Grandstands moved back to clear the backstretch apron. The selector preview frame is padded to `-4 -4 116 92` so a turned layout and its 5-unit stroke are not clipped.
- `banking.test.js` finds the turn by steepest bank rather than a fixed coordinate, so it follows the layout. Full tests/build/diff checks passed. Chromium checked the turned Daytona view and the Gravel Pit for shadow regressions; desktop and phone framing were verified numerically against `resize()`. Background tabs throttle the animation loop, so no in-browser lap was driven. No deployment performed.
