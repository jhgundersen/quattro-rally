# Quattro Rally — session knowledge

Distilled on 2026-09-05. This records project context and verified session outcomes; check the current code and configuration before relying on version-specific paths.

## Purpose and user preferences

- Build a Three.js arcade racer inspired by Ivan “Ironman” Stewart’s **Super Off Road**, with four differently colored Audi Sport Quattro-inspired rally cars as a salute to **Omarchy Quattro**.
- Use original procedural models and scenery. The liveries are amber, sage, coral, and lavender.
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

Races have one player, three AI opponents, and three laps. Controls: WASD/arrows to drive, Space for rechargeable nitro, P/Escape to pause, R to restart, Enter to start/replay. Narrow screens have touch controls. Engine audio is synthesized and opt-in. Losing focus pauses the race.

| File | Responsibility |
| --- | --- |
| `src/main.js` | Renderer, isometric camera/framing, car models, UI, input, audio, persistence, and game loop |
| `src/tracks.js` | Course definitions, difficulty, surface behavior, and solid obstacles |
| `src/course.js` | Shared curve geometry, course queries, and selector previews |
| `src/world.js` | Procedural terrain, barriers, arrows, jumps, scenery, and resource disposal |
| `src/physics.js` | Shared player/AI driving, AI controls, and car collisions |
| `src/race.js` | Lap progression, heading wrapping, and time formatting |
| `index.html`, `src/style.css` | Page, race HUD, overlays, course cards, and responsive controls |

- Physics uses a fixed 60 Hz step; rendering uses `renderer.setAnimationLoop`.
- Camera position `(90, 90, 90)` looking at the origin gives 45° azimuth and approximately 35.3° elevation. Orthographic framing fits each course in camera space, including road margins, airborne cars, banners, and relevant scenery. Recalculate on track changes and viewport resize.
- Best times are local and separated by course revision: `quattro-best-${track.id}-v${track.revision}`. Current layouts are revision 2. Increment revisions when layout changes invalidate previous times; retain older stored records.
- `window.quattro` exposes read-only telemetry such as track, state, race time, cars, and draw calls.

## Courses and layout lessons

| ID / course | Biome and difficulty | Layout and hazards |
| --- | --- | --- |
| `gravel` / The Gravel Pit | Quarry, 1/4 Rookie | Horseshoe bowl, long back straight, deep infield U, three jumps, mud, boulder |
| `forest` / Black Pine Run | Forest, 2/4 Clubman | Twin hairpins, folded infield, water crossing, mud, trees, fallen log |
| `desert` / Red Rock Scramble | Desert, 3/4 Pro | Canyon switchback, parallel straights joined by 180° turns, sand, rocks, four jumps |
| `alpine` / Frostbite Pass | Alpine, 4/4 Expert | Frozen cloverleaf, four lobes, alternating turns, ice, meltwater, trees, rocks |

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
