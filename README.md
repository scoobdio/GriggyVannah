# GriggyVannah

GriggyVannah is a stylised 3D savannah ecosystem designed to run by itself as a living display. Leave it running and watch animals respond to their needs, each other and a changing world, without controlling them. Prioritise an appealing, coherent world with observable cause and effect. This is entertainment, not a claim of scientific ecological accuracy.

Development is intended on a MacBook with VS Code. The eventual display is a Raspberry Pi connected to a screen and running a browser; its model, resolution and performance budget are not yet confirmed. Normal viewing must require no input. Optional development controls, diagnostics and configuration are welcome.

The intended stack is TypeScript, Vite and Babylon.js. Start with a browser application and avoid adding a backend, cloud services or other frameworks for hypothetical future needs.

## Scope

The first deliverable is a small autonomous scene: grassland, one watering hole and one placeholder herbivore that repeatedly becomes thirsty, travels to water and drinks while water replenishes. Make this cycle reliable and legible before expanding the ecosystem.

The longer-term world includes open plains, clusters of trees, sheltered areas and watering holes, with resources that are consumed and replenished. Animals may graze, drink, rest, travel, group, flee, hunt and reproduce. Births, ageing and deaths should eventually affect populations. Day/night cycles, temperature and rain now affect lighting and pond water. Animal heat and shade seeking are implemented: in hot sunshine the herbivore seeks tree shade and rests while cooling, with rain reducing exposure. Hunger-driven grazing and rain-dependent grass patches are also implemented. Loose grouping is implemented; fleeing, hunting, reproduction and population dynamics remain ambitions.

## Current implementation and evidence

The original checkout contained only this README. A minimal browser application has now been established from scratch using TypeScript, Vite and Babylon.js. The previously reported implementation was not present and has not been treated as recovered code.

| Area | Present in code | Verification |
| --- | --- | --- |
| Canvas and application startup | `index.html`, `src/main.ts` | Validation results below. |
| Fixed camera, daylight and scene assembly | `src/scene.ts` | Validation results below. |
| Reusable `createGrassland` and `createPond` helpers | `src/world.ts` | Simple ground, sand bank and opaque water meshes. |
| Pond position/radius and ground dimensions | `src/config.ts` | Geometry is shared with simulation interaction distances. |
| Resize and development cleanup | `src/main.ts`, `src/scene.ts` | Adjusts rendering size/camera coverage; disposes the engine on module replacement. |
| Autonomous herbivore and water stock | `src/simulation.ts`, `src/ecosystem.ts`, `src/animal.ts` | Focused automated checks and browser verification described below. |
| Trees and usable shade | `src/habitat.ts`, `src/trees.ts`, `src/simulation.ts` | Shared canopy regions, heat state and reachable shade selection. |
| Procedural sky and landscape | `src/sky.ts` | Sun, clouds, stars, moon and distant hills; no external assets. |
| Day/night, temperature and weather | `src/environment.ts`, `src/weatherView.ts` | Deterministic environmental rules; smooth lighting and lightweight rain visuals. |
| Overhead thirst/behaviour and pond supply indicators | `src/stats.ts`, `src/style.css` | DOM meters follow the animal; pond panel includes completed cycles. |

Three independently tracked ponds start full and fill through rain and slowly evaporate during clear peak-heat hours. Seven stylised low-poly herbivores now seek water, drink, wait for replenishment when necessary, and roam between needs across the ground. Thirst, heat, hunger, grass food/moisture and available water are simulation state, independent of their visual representation. No backend, persistence or external assets have been added. The camera has no input controls.

Baseline validation on 22 October 2026 (before the autonomous milestone):

- Dependency installation completed successfully with no audit vulnerabilities reported at installation time; exact dependency versions are pinned and locked.
- `npm run build` passed, including `npm run check`, using Node 24.21.0 and npm 11.19.0.
- The Vite development server returned HTTP 200. Safari on the development Mac visibly rendered the grassland, sand bank and water, including after live reload and a window-size change.
- Browser inspection caught a ground dimension mapping error that type checking did not catch; it was corrected and visually rechecked before the final successful build.
- Vite reported a large-chunk warning: the main production JavaScript chunk is approximately 1.02 MB minified / 241 kB gzip. This is a download-size observation, not a frame-rate measurement.
- Browser console diagnostics, narrow portrait layouts, the WebGL failure path, production-preview rendering, Raspberry Pi performance and sustained unattended operation remain unverified. The earlier baseline did not include animal behaviour.

Earlier autonomous milestone verification (before weather-driven replenishment):

- `npm test`: all six focused checks passed, covering movement clamping, range/access/request guards, exact consumption, hydration limits, bounded resources, empty/unreachable recovery, repeated cycles and refill capacity.
- Equal two-minute simulated runs at 30 and 144 render updates per second produced identical state. A one-hour frame gap advanced only 250 ms of simulated time.
- `npm run build` passed with the existing large-chunk warning (main JavaScript approximately 1.03 MB minified / 244 kB gzip).
- Chrome on the development Mac completed four cycles without input over approximately two minutes with default configuration. Visual checks showed the animal at the bank waiting for replenishment, then seeking/returning in later cycles, with the overhead thirst label tracking its position. The pond began empty. No console warnings or errors were captured. The automated Safari inspection displayed the DOM but did not provide a rendered frame during that session. The user subsequently confirmed that the autonomous milestone works correctly in Safari; this is user-confirmed verification, separate from the automated Chrome check.
- Pi performance, extended unattended reliability, portrait layout and production-preview rendering remain unverified.

Weather milestone verification:

- All 12 automated tests passed, including exact clear-temperature extrema, midnight wraparound, smooth rain transitions, rain cooling, peak-hour-only evaporation, separate water accounting, and six simulated days of bounded resources and recovery. The existing movement/drinking and frame-rate independence checks also pass.
- `npm run build` passed, including TypeScript checking. Vite still reports a large-chunk warning; the main production chunk is approximately 936 kB minified / 222 kB gzip, with additional shader chunks.
- Chrome showed clear midday conditions with evaporation, then nighttime rain, pond recovery to 99/100 water and seven completed drinking cycles. Time advanced from Day 1 at 08:00 to Day 2 around 02:54 with no captured console warnings or errors. This verifies day-to-night progression; a full 24-hour wrap is covered by automated logic tests rather than a complete browser observation.
- The user also reported the feature running correctly. Safari automation was intentionally skipped. Pi performance and extended real-time unattended operation remain unverified.
- Water balance is provisional: bounded quantities and recovery do not establish a sustainable supply/demand balance. Tune pond capacity, starting stock, rain timing/intensity, evaporation, thirst and drinking rates together in a later increment; leave this milestone's values unchanged pending that work.

Habitat and sky milestone verification:

- All 18 tests passed, including shade boundaries, safe route selection, arrival/cooling/resumption, urgent thirst interrupting cooling, unavailable shade, rain/night cooling and multiple days of bounded heat and continued drinking. Existing water, weather and timing tests remain passing.
- `npm run build` and TypeScript checks passed. Vite retains its large-chunk warning: main JavaScript approximately 1.09 MB minified / 263 kB gzip, plus shader chunks.
- Chrome rendered the normal daytime habitat, sun, clouds and hills. Explicit development presets verified stars/moon at night, heavy rain cloud cover and a subsequent completed drinking cycle, plus shade arrival with the visible heat stat falling from 90% to 52% while “Cooling in shade.” No console warnings or errors were captured.
- These targeted browser checks do not constitute a full unattended environmental-cycle or Pi performance test. Portrait framing and the new camera on the target display remain unverified. Shade geometry is deliberately approximate, and no water-balance values were retuned.

Expanded gathering area verification (23 October 2026):

- Focused pond checks pass: full initial stock, conservative dry-spell arithmetic, access to all three ponds, switching after depletion, isolated consumption, a 30-second normal run, and brief unavailable/rain recovery scenarios.
- Selected movement, drinking, heat/shade and weather-accounting regression checks passed during this change. After reducing vegetation to four varied trees, the five pond checks and two shade-priority/arrival checks passed again.
- TypeScript and the production build pass; the existing large-bundle warning remains. Chrome spot checks showed the continuous landscape, three full ponds, four varied trees, scattered bushes and active drinking, with no captured console errors.
- No full-suite or multi-day simulations were run for this increment, as requested. Earlier test files retain explicit small, initially dry single-pond fixtures for historical edge cases; the production defaults are the larger full ponds. Dry-spell longevity is an arithmetic estimate for the current single animal, not a measured long-run result. Pi performance remains unverified.

Whole-ground movement and rain update (23 October 2026):

- Ground dimensions in `src/config.ts` also define navigable bounds. Roaming replaces the fixed-home loop; water and shade remain higher priorities. Paths are planned on destination changes, not every simulation tick. Existing fixed-home test fixtures explicitly disable roaming.
- Three focused navigation checks passed: safe water routes from all four ground corners, pond detours and boundary rejection, and a short roaming/need-interruption scenario. Five pond checks and four selected movement/drinking/shade regressions also passed. No full-suite or multi-day run was performed.
- Rain now fills the camera view with independently spaced, layered streaks; it remains a visual effect driven by the same rainfall intensity, without changing pond replenishment. Chrome visually showed full-view rain and active roaming/drinking, with no captured console errors. TypeScript and production build passed with the existing bundle-size warning. Pi performance, portrait rendering and sustained operation remain unverified.

Left-side habitat refinement (23 October 2026): the west acacia is now 7.2 units tall with a six-unit usable shade radius, and extra low scrub fills the left foreground. The camera and four-tree count are retained. The production build and six selected shade/navigation checks passed; Chrome showed the enlarged tree, open shade footprint and animal approaching it without captured console errors. No multi-day run was performed.

Run `npm run dev` to view the scene.

## Setup and commands

Use Node.js 22.12 or newer (development verified with Node 24) and npm. A browser with WebGL enabled is required. VS Code is optional. Dependencies are recorded in `package.json` and locked in `package-lock.json`.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The development server binds to this machine only. No account, environment variables or cloud services are needed.

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the versions in the lockfile on a fresh checkout. |
| `npm run dev` | Start Vite's development server with live updates. |
| `npm test` | Run focused simulation checks without Babylon or a browser. |
| `npm run check` | Check application TypeScript without emitting files. |
| `npm run build` | Run the type check, then create the production application in `dist/`. |
| `npm run preview` | Serve the existing production build locally; run the build first. |

Stop a local server with Ctrl+C. `npm test` uses Node’s built-in test runner and TypeScript stripping (available with the explicit flag on the supported Node versions), without additional test dependencies. A successful build does not prove correct simulation behaviour.

The setup follows the [Vite guide](https://vite.dev/guide/) and uses [Babylon's ES module packages](https://doc.babylonjs.com/setup/frameworkPackages/npmSupport/). No custom Vite configuration is required for this baseline.

## Architecture

### Existing structure

- `index.html`: canvas, quiet display caption and startup-error message.
- `src/main.ts`: engine creation, render loop, resize handling and development cleanup.
- `src/scene.ts`: fixed overview camera, lighting and world assembly.
- `src/world.ts`: reusable grassland and pond mesh/material creation functions.
- `src/config.ts`: visual dimensions, pond placement and pixel-density cap.
- `src/grass.ts`: patch positions, food/moisture state and weather-driven growth/withering.
- `src/grassView.ts`: reusable patch beds and merged grass tufts, coloured/scaled by stock.
- `src/environment.ts`: simulated time, temperature curve, rain schedule and environmental water rates.
- `src/weatherView.ts`: lighting, sky updates and a reusable rain line-system mesh.
- `src/sky.ts`: procedural sky dome shader and distant landscape.
- `src/habitat.ts`, `src/trees.ts`: shared tree/shade configuration and reusable stylised tree creation.
- `src/herd.ts`: herd creation, shared-resource ticking, grouping, solo excursions and separation.
- `src/simulation.ts`: plain state, movement, water accounting, behaviour and fixed-step clock.
- `src/ecosystem.ts`: connects simulation state to meshes and overhead DOM stats.
- `src/animal.ts`: low-poly herbivore meshes and simulated-time walk, feeding, idle and resting animation.
- `src/surface.ts`: deterministic procedural coverage textures and feathered ground overlays.
- `src/stats.ts`, `src/style.css`: overhead thirst/behaviour label, water supply panel, environmental readout and display styling.
- `tests/herd.test.mjs`, `tests/grass.test.mjs`, `tests/roaming.test.mjs`, `tests/ponds.test.mjs`, `tests/simulation.test.mjs`, `tests/environment.test.mjs`, `tests/shade.test.mjs`: focused simulation, weather, timing and water-balance checks.
- `package.json`, `package-lock.json`, `tsconfig.json`: commands, dependencies and strict TypeScript configuration.

Meshes, materials and stat elements are created once. A fixed 1/60-second simulation step runs independently of rendering; the scene displays the resulting state. Shade footprints use simple ground meshes, independently of the sky and lighting; small canvas-generated textures soften ground coverage and provide soil variation and water ripples. There are no dynamic shadow maps, post-processing effects or downloaded assets. The rendering pixel ratio is capped at 1.5 as a provisional cost restraint, not a measured Pi performance guarantee.

### Recommended evolution

Keep the design small and introduce structure as the first demonstration requires it:

- Keep startup code focused on assembling the canvas, renderer, scene, configuration and update loop.
- Separate ecosystem state and behaviour from Babylon meshes and materials. Position, thirst and water quantity should be inspectable without constructing a rendered scene.
- Keep resource quantities distinct from their appearance. A pond mesh is not the authoritative water supply; a visual change should reflect state.
- Use reusable creation functions and explicit configuration for pond locations, sizes, interaction distances, movement speeds and resource rates.
- Create objects once and update them over time. Avoid recreating meshes or materials in the update loop.
- Advance simulation using simulated elapsed time, independently of rendering frame rate. A small fixed-step loop with an explicit catch-up limit is a reasonable starting recommendation; document what happens after long pauses.
- Keep movement and resource rules straightforward and deterministic where practical. Add abstractions only when duplication or complexity justifies them.
- Make behaviour checkable through state and focused logic checks, alongside browser inspection. A visible animation alone is insufficient evidence that water accounting or timing is correct.

Initially, startup, a small simulation module and scene creation helpers may be sufficient. Proposed module names and folders are intentionally left open until there is code to organise.

## First autonomous demonstration — implemented

Implemented with one placeholder herbivore. Its overhead label shows behaviour, heat and thirst from 0–100% (higher means thirstier); the pond panel shows total supply, individual reserves, the selected pond and completed drinking cycles.

Default rules in `src/simulation.ts`:

- Start with thirst 55 and three full ponds: Central pool 2,200 units, West pool 2,000 and East pool 2,000. The central radius is now 4.8 scene units; the others are 4.0 and 4.3. Configuration is shared between rendering and logic in `src/config.ts`.
- Thirst rises 3 points per simulated second, capped at 100. Seek water at 60 and finish drinking at 10.
- Travel at 2.4 scene units per simulated second to a radial bank point 0.75 units outside the water. Drink only outside the pond and within 0.85 units of its edge.
- Consume up to 12 water units per second; each water unit removes 4 thirst points. Consumption is capped by available stock and remaining need.
- Apply rainfall and evaporation before drinking each simulation tick, keeping water between zero and capacity. Constant replenishment has been replaced by the weather rules below.
- Choose the closest stocked, accessible pond with a safe bank approach. If the target dries up or becomes inaccessible, retry selection once per simulated second. Wait safely if none is reachable. All ponds refill independently; drinking debits only the selected one.
- Return to the starting resting spot after drinking, then repeat. Bank candidates are sampled around each pond and checked against all ponds and tree trunks. Travel directly when possible or via the resting spot when both segments are clear. Every selected bank has a safe return route. Shade candidates require a safe route back to the resting spot; general pathfinding is not implemented.
- Hidden tabs pause progression. Frames longer than 250 ms discard excess time to bound catch-up work; reopening the app resets the world. This is a reversible initial policy, not a save/resume or offline-progression commitment.

The water surface fades as supply falls; its bank and interaction radius stay fixed. All ponds start full, so initial drinking no longer waits for rain. Configuration values are developer-owned and should remain finite with positive capacity, speed, hydration conversion and retry interval; the edge offset must fit within drinking range.

The implemented end-to-end loop:

1. Display grassland, one watering hole and one placeholder herbivore.
2. Increase the animal's thirst over simulated time, with explicit lower and upper bounds.
3. At a configured thirst threshold, select an accessible point at the water's edge and travel towards it.
4. Stop within the configured drinking range. Consume water only while in range.
5. Reduce available water by the amount actually consumed and reduce thirst according to an explicit conversion rule.
6. Replenish the pond through rain at a configured rate per simulated second, capped at its capacity; slowly evaporate water during clear peak-heat hours.
7. Leave the drinking state when sufficiently hydrated, then allow the cycle to repeat without input.

Use explicit units and configuration for rates, thresholds and distances. For this simple scene, an edge point on open ground is enough; general pathfinding is not required. Visible thirst, behaviour, water supply and cycle count expose cause and effect.

### Acceptance criteria

- **Arrival:** movement clamps travel to the remaining distance so the animal stops in range without overshooting, oscillating around the target or entering the pond. Check different step sizes and speeds.
- **Range:** out-of-range or inaccessible interactions consume zero water and do not hydrate the animal. Test points just inside and outside the interaction boundary.
- **Accounting:** consumption cannot exceed the requested amount, available water or the animal's remaining hydration need. Water stays between zero and capacity; thirst stays within its configured bounds. Non-positive requests consume zero.
- **Drinking:** in-range consumption changes both thirst and water by the documented rule. Account for replenishment separately so the net pond change is explainable.
- **Empty or unreachable water:** the animal does not drink remotely, obtain water from an empty pond or jitter endlessly. A recommended initial rule is to wait safely and retry at a bounded interval; an unreachable target leaves it idle until a reachable target is available. Thirst remains bounded. Mortality is outside this milestone.
- **Replenishment:** an empty pond recovers according to its configured rule and never exceeds capacity. A waiting animal can resume drinking once water is available.
- **Timing:** focused checks using equal simulated durations and different render/update schedules produce equivalent outcomes within a documented tolerance. Large elapsed-time gaps do not cause teleporting or unbounded catch-up work.
- **Autonomy:** browser inspection demonstrates at least three complete thirst/travel/drink cycles without user input, including recovery from an empty pond. Record browser, configuration, duration and any remaining limitations.

Validate the state rules with focused automated checks once a test setup exists, and inspect movement and visual clarity in the browser when tools allow. Report either layer as unverified if it cannot be exercised.

## Incremental roadmap

Each stage should remain small enough to demonstrate and validate independently. Split stages further when necessary.

| Stage | Observable outcome | Validation |
| --- | --- | --- |
| 0. Runnable baseline (implemented) | Grassland and a pond, a fixed overview camera and resize handling. | Verify actual setup/build commands and inspect browser startup, canvas resize and console errors. |
| 1. Autonomous drinking (implemented) | One herbivore completes the demonstration above. | Focused timing, movement, bounds and accounting checks; repeated browser cycles and empty-water recovery. |
| 2. Grazing and hunger (implemented); fatigue/rest later | An animal seeks edible patches, consumes food and resumes activity; rain regrows grass and prolonged dryness withers it. A separate fatigue/sleep need remains planned. | Check resource consumption, need bounds and priority conflicts; observe transitions without rapid switching. |
| 3a. Day/night, weather and pond balance (implemented ahead of grazing) | A simulated day changes daylight and temperature; rain fills the pond and peak-hour sun slowly evaporates water. | Check clock wraparound and equivalent time progression across render rates; observe a complete day/night transition. |
| 3b. Animal heat and tree shade (implemented) | Simple trees provide accessible shade; an animal seeks and rests in shade during hot peak daytime sunshine, with rain reducing the need for sun shelter. | Check sunny midday, rain, night, shade boundaries and unavailable shade; observe travel, arrival, cooling and return to other activities. |
| 4. Multiple animals (seven-member herd implemented); local perception later | Individuals share food/water, favour group proximity and sometimes explore alone. Bound perception before scaling further. | Check perception boundaries and resource contention without negative stock; measure increasing populations. |
| 5. Predators, fleeing and hunting | Prey respond to nearby threats and predators pursue with explicit success/failure rules. | Check detection, escape, pursuit termination and encounter outcomes in repeatable scenarios. |
| 6. Life cycles and populations | Births, ageing and deaths change population counts according to explicit rules. | Check lifecycle boundaries and counts, then run repeatable longer scenarios; apply the agreed collapse/replenishment policy. |
| 7. World and presentation | Refine trees and shelter, then add animation, sound and visual polish incrementally while behaviour remains readable. | Inspect visuals and behaviour, track asset licences, and compare measured performance before and after each addition. |
| 8. Persistence and delivery | If approved, save/resume works and a chosen deployment supports unattended display. | Check save round trips and version handling; test browser restart, reload and sustained runs on the target Pi. |

Performance measurement and unattended-run checks begin at the runnable baseline and continue throughout; they are not deferred to the final stage. Simple visual polish can happen earlier when it improves clarity without blocking behaviour work.

### Day/night, temperature and weather — implemented

Defaults are explicit in `src/environment.ts` and use simulated elapsed seconds, not the computer's wall clock:

- Start at 08:00; a full 24-hour day takes 300 simulated seconds (five minutes at normal speed). Day count increments at midnight.
- Clear-weather temperature follows a smooth asymmetric curve from 18 °C at 02:30 to 35 °C at 14:00, then back to the next trough. These are entertainment tuning values, not a climate model. Rain cools that baseline by up to 4 °C, so weather can alter the observed daily maximum/minimum.
- Daylight rises from 06:00, peaks at noon and falls to night at 18:00. Ambient illumination remains sufficient to watch animals at night. Sky colour and lighting respond smoothly to daylight and rain.
- Repeat 80 seconds clear, then 40 seconds rainy. Rain intensity eases in/out over five seconds. The 120-second weather period differs from the 300-second day so rain does not always coincide with the same hour.
- Full-strength rain adds 8 water units per simulated second, scaled by intensity. Direct sun evaporates at most 0.06 units per second, peaking at 14:00 and tapering to zero at 11:00 and 17:00. Evaporation stops at night and whenever rain intensity is positive.
- Rainfall and evaporation are distinct from animal consumption. Weather rates describe potential flow: a full pond cannot overfill, and an empty pond cannot lose more water. The pond panel labels weather inflow/loss separately from the animal's drinking state.
- The environmental panel displays day, 24-hour time, sunshine/rain/clear night and ambient temperature. Rain uses 420 wind-slanted streaks with varied speeds and lengths across camera-relative depth layers, covering the viewport and adapting to its aspect ratio in one reusable mesh; no textures or external assets are needed.
- Hidden-tab pausing and the existing bounded fixed-step clock apply equally to weather, temperature, animal behaviour and water. Reloading resets everything.

Configuration requires a positive day length, non-negative clear/rain durations with a positive total period, non-negative transition/rate values, and ordered minimum/maximum temperatures. Seasons and random weather are not implemented.

### Edible grass and hunger — implemented

Five patches in `src/grass.ts` start full, with 920 food units in total. Patch food is distinct from moisture (0–1) and from the rendered grass. Patch beds become browner and tufts shrink as supplies/moisture fall; rain can regrow even completely eaten patches. The surrounding plain and decorative bushes are not edible resources.

- Moisture starts at 0.65 and falls by 0.0008 per simulated second without rain. Below 0.2, food slowly withers at 0.035 units per second. The initial moisture buffer lasts about 1.9 simulated days without rain; fully wet soil lasts about 3.3 days before withering begins. These are arithmetic estimates, not multi-day test results.
- Full-strength rain restores 0.025 moisture and 0.6 food per second per patch. Rates scale with rain intensity; drying and withering scale with its absence. Food cannot exceed patch capacity or fall below zero. All values are provisional gameplay tuning.
- Hunger starts at 40, rises by 0.7 points per second and is bounded to 0–100. At 55 the animal seeks a nearby reachable stocked patch; grazing consumes up to four food units per second and restores four hunger points per unit, stopping at 15. Eating happens only inside the selected accessible patch. Compact overhead hunger bars and a total grass food readout make consumption visible.
- Travel uses existing obstacle-aware routes. Drinking and heat management take priority; thirst reaching its normal threshold interrupts grazing. Empty or inaccessible food produces “Waiting for grass” with bounded retries; rain regrowth can resume feeding. Active water waiting remains the priority when both food and water are unavailable.
- Hunger does not yet cause injury or death. Fatigue, sleeping, more sophisticated competition and a sustainable herd food balance remain future work.

Verification: five focused grass tests, five pond tests, three navigation tests and selected shade regressions passed. Chrome showed the animal grazing, hunger decreasing and food consumption with no captured console errors. Production build/type checking passed with the existing bundle warning. Only short spot checks were run; no multi-day or Pi performance test was performed.

### Gathering-area water reserves

The target remains no routine shortage, with drought risk after roughly 7–10 rainless simulated days. Seven herbivores can demand at most `7 × 3 / 4 × 300 = 1575` units per day. All three ponds together lose at most 6.75 units per clear day to evaporation. Current starting stocks/capacities are 5500, 5000 and 5000 (15,500 total). Allowing 175 units for initial thirst gives roughly **9.7 rainless days across the shared reserves**. An individual pool can empty sooner; animals must switch to the remaining pools. This is an arithmetic estimate, not a long-run result or a scripted deadline.

Full-strength rainfall is now 8 units per second per pond, increased for the seven-animal herd; the 80/40-second schedule is unchanged. Earlier single-animal verification and estimates above are historical. Grass regrowth remains provisional and may need tuning under sustained herd grazing. No population-wide sustainable balance or Pi performance has been claimed.

### Herd and compact stats — implemented

`src/herd.ts` creates seven individually tracked animals sharing the same food and water arrays. Weather replenishment runs once per simulation tick; animal consumption is applied sequentially, rotating first access so one member does not always get first choice. Initial needs are staggered.

- Social destinations are reconsidered every four simulated seconds. Most members favour positions within five units of the non-solo group centre. Staggered 20-second solo windows in a 160-second period encourage occasional excursions about 20 units from the group, followed by regrouping. Needs always take priority; a solo intention does not guarantee uninterrupted solo travel.
- Different feeding/shade spots, bank crowding penalties and gentle local separation reduce stacking. Movement still respects ponds, trunks and ground boundaries. This is loose grouping with global herd awareness, not a local-perception flock model, strict collision system or predator response.
- Each animal has a small numbered badge with blue thirst, green hunger and orange heat bars. Hover a badge for behaviour and numeric needs. The shared panel gives the colour legend, herd size, solo intentions, total drinking cycles and resource stock. Offscreen badges are hidden. Badges stay directly above their animal, and full behaviour/numeric needs remain in accessible labels.
- Focused checks cover seven independent animals, shared depletion, once-only weather updates, solo/regroup intentions, and 35 seconds of safe herd movement and multiple drinking cycles. Grass and pond regressions passed. A test initially referenced the wrong rainfall field; corrected checks pass. Chrome showed all seven animals, smaller badges, independent needs and drinking, with no captured console errors. Build/type checking passed with the existing bundle warning. No full-suite, multi-day or Pi run was performed.

### Animal heat and tree shade — implemented

Four scattered stylised acacia trees of varied height (2.7–7.2 units) and canopy radius (2.0–6.0 units) share their positions and canopy radii between visuals and simulation (`src/habitat.ts`). One continuous 240 × 240 grassland now covers the visible ground, replacing the contrasting central square and separate surrounding plane. Sparse trees and low bushes frame three watering holes with open banks and gathering space. The west acacia is a larger landmark on the left side, with a six-unit shade radius for future herds. Additional low scrub fills the left foreground, while canopy footprints and pond banks stay clear. There are still four trees. Herd members use different canopy resting spots, but shade has no capacity reservation or territorial competition yet. Bushes are passable decorative scrub; tree trunks and pond interiors constrain routes. Distant hills remain scenery. The herd now roams across the full ground (with a one-unit edge margin), interrupted by thirst, heat and hunger needs. Deterministic destinations span the ground; the current rapid thirst cycle naturally keeps most activity nearer water. The fixed camera still shows only part of the habitat, so animals can travel out of view.

- Heat is a bounded 0–100 stat, starting at 20. Direct exposure scales with ambient temperature above 24 °C, daylight and absence of rain. Maximum configured heating is 4 points per simulated second; low exposure permits passive cooling.
- Seek shade at heat 60; resume other activities at 25. Separate thresholds prevent rapid switching. Shade cools at 5 points per second. Rain and night reduce exposure and end unnecessary shade-seeking.
- Choose a nearby accessible canopy resting spot using obstacle-aware waypoint routes. A small visibility graph routes around pond interiors and tree trunks; water selection no longer requires a route via the original resting spot. Resting spots sit away from the trunk, inside the canopy footprint.
- At the resting spot, the herbivore lowers its body to suggest sitting and the label reads “Cooling in shade.” The overhead heat meter makes recovery visible.
- Thirst at 85 or above interrupts cooling when reachable pond water is available. An empty or inaccessible pond does not prevent cooling; drinking resumes when supply returns. Active drinking finishes before seeking shade.
- If no safe shade is available, retry at a bounded interval while continuing existing behaviour. Tree locations and simulated shade footprints are static; canopies sway visually; moving/removing trees and complex terrain navigation remain outside this increment.
- Heat does not yet increase thirst or cause injury/death. Hunger and grazing are implemented as a separate need. The larger, initially full reserves described below replace the earlier small-pond defaults.

### Visual refinement — 24 October 2026

The low-poly style is retained, with more natural silhouettes and softer transitions:

- Grass beds use irregular feathered coverage rather than solid discs, with denser, uneven tufts that gently sway. Colour and height still reflect food/moisture. Shade uses soft canopy/contact overlays, and sandy banks fade into subtly mottled terrain.
- Trees have branching trunks and subtle canopy movement. Water has drifting procedural bump ripples. These are inexpensive approximations, not physical water or sun-projected shadows.
- Herbivores have shaped bodies, necks, muzzles, ears, horns, eyes and hooves. Jointed legs follow distance travelled, turns ease toward travel direction, feeding lowers the head/neck, and idle breathing, tail movement and folded resting legs add life.
- Animation uses simulation time and pauses with the world. Visual grass/shade feathering does **not** change the circular interaction ranges or resource accounting. The softer boundaries deliberately avoid drawing exact gameplay outlines.
- Textures are generated once locally; grass tufts are merged per patch. Per-frame updates reuse meshes/materials. The added geometry, transparency and bump mapping still need measurement on the actual Pi.

Type checking and the production build pass (existing bundle-size warning remains). Nine focused herd/grass checks passed; Chrome spot checks showed the revised terrain, animals and feeding preview without captured console errors. A canvas typing incompatibility was corrected during the build, and an overly dark terrain tint was corrected during visual inspection. No full-suite, multi-day, Safari or Pi run was performed. Animation quality across all frame rates and all lighting conditions remains unverified.

### Sky and backdrop — implemented

A procedural sky dome blends daylight, warm dawn/dusk horizons and night colours. It includes a stylised sun, drifting clouds, deterministic stars and a textured-looking procedural moon. Rain thickens and darkens cloud cover and obscures celestial features. This is artistic presentation, not astronomical simulation: the moon follows a stylised nightly arc opposite the sun, with a fixed full-moon appearance; the star field rotates once per simulated day around a tilted axis. Both use simulated time and continue smoothly across midnight. Canopy footprints do not move with the sun. The moon’s crater pattern moves with its disc rather than sliding across it. Chrome checks at 22:14 and 00:50 confirmed changed moon/star positions across midnight with no captured console errors; all 18 existing tests and the production build passed after this update.

The camera remains fixed and input-free, at a lower angle to include the horizon. A continuous ground plane and low-poly distant hills replace the isolated floating-plane appearance. The sky uses one shader/material and dome mesh; it adds no image assets, libraries or cloud services. Pixel shading still needs measurement on the actual Pi.

For reproducible development-only browser inspection, append `?preview=heat`, `?preview=night`, `?preview=rain` or `?preview=grazing` to the Vite URL. Heat starts at 14:00 with a hot animal, night at 22:00, and rain at 14:00 with full rain intensity. Grazing starts with high hunger and low thirst for a quick feeding check. Each shows an explicit development-preview notice. Remove the query to restore the normal cycle. Production builds ignore these presets.

## Performance and reliability

Design for limited hardware without claiming unmeasured capability:

- Start with simple geometry, reusable materials, restrained lighting and minimal effects. Add shadows and expensive effects only after measuring their cost.
- Avoid unnecessary per-frame allocations, scene rebuilding and all-to-all animal searches. Update needs and perception at appropriate simulation intervals; optimise based on evidence.
- Measure frame times, simulation update cost, memory behaviour and entity counts under recorded settings. Treat resolution, population caps and frame-rate targets as provisional.
- Test on the actual Pi as soon as a baseline runs. Record Pi model, browser, renderer, display resolution, cooling and power conditions where relevant.
- Test sustained unattended operation as well as startup. Begin with repeated cycles, then increase run duration and record resource bounds, console errors, memory growth, frame-time degradation and thermal effects.
- Define pause, background-tab and long-frame behaviour explicitly. Browser throttling must not silently become an assumption about simulated time or offline progression.

Remote hosting is optional and unresolved. **Static website hosting** serves application files; the Pi still runs the simulation and renders locally. **Server-side simulation** moves state updates to a server but requires a backend and synchronisation, and does not itself move rendering. **Remotely streamed rendering** renders elsewhere and sends video to the Pi, introducing a different system with bandwidth, latency and operating costs. None is currently implemented or approved by this brief.

## Open product decisions

Recommendations below are starting points for discussion, not approved commitments.

| Decision | Recommended default and rationale |
| --- | --- |
| Exact Pi, display resolution and performance targets | Confirm the available hardware and measure the baseline before setting limits; do not promise a population or frame rate yet. |
| Pond supply/demand balance | Shared reserves conservatively cover roughly 9.7 rainless days for seven animals. Recalculate when population, day length or thirst rates change. |
| Day length and weather tuning | Current provisional defaults are a five-minute day and 80/40-second clear/rain periods. Tune after observation; heat and shade thresholds are provisional too. Defer seasons and complex weather. |
| Save/resume | Defer persistence until the autonomous loop is stable, then consider a local snapshot if continuity is desired. This keeps the initial scope small. |
| Progression while the browser is closed | Initially evolve only while running. Offline catch-up or an always-running server needs an explicit product decision. |
| Population collapse versus migration/replenishment | Keep death out of the first demonstration. Later consider explicit, observable migration to sustain a living display, subject to approval; never silently replace animals. |
| Camera behaviour | The current fixed camera includes the horizon, animal and water. Consider gentle autonomous camera movement later; normal viewing should remain input-free. |
| Species | Begin with a generic placeholder herbivore, then choose a small set whose interactions are easy to observe and verify. |
| Asset sourcing and licensing | Start with simple procedural shapes. Before adding external models, textures or sound, record source, licence and attribution requirements. |
| Hosting and delivery | Start locally in the browser. Choose static hosting only if convenient distribution is needed; consider server simulation or streaming only for a demonstrated requirement. |

## AI development working agreement

- When starting future work, read this README alongside applicable repository instructions.
- Implement requested milestones directly, including code, appropriate checks and documentation. This is an implementation partnership, not a TypeScript tutoring exercise.
- Make reasonable, reversible technical decisions without asking about every detail. Record non-blocking unknowns and proceed.
- Ask concise questions when a decision materially changes product scope, cost, external commitments or destructive behaviour.
- Deliver small working increments, preserve existing functionality and respect unrelated local changes.
- Explain outcomes and significant tradeoffs in accessible language. Do not assign the user implementation homework or wait for them to write the code.
- Do not confuse a successful build with correct simulation behaviour. Validate logic with focused checks and inspect browser behaviour when tools allow.
- Report what was tested, what failed and what remains unverified. Distinguish inspected code, executed behaviour, plans and unknowns.
- Keep this README aligned with completed milestones, actual paths and supported commands.
- Use Chrome for automated browser verification; Safari automation is not required. The Raspberry Pi browser remains the eventual hardware target.
- Include a suggested git commit message at the end of each completed task; do not commit unless asked.

Next, add bounded local perception and refine resource contention before introducing predators and fleeing. Trees, shade and the sky are implemented; further habitat polish should preserve readable behaviour. The app remains local-only; no hosting, deployment, push or commit is part of this increment.
