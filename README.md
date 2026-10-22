# GriggyVannah

GriggyVannah is a stylised 3D savannah ecosystem designed to run by itself as a living display. Leave it running and watch animals respond to their needs, each other and a changing world, without controlling them. Prioritise an appealing, coherent world with observable cause and effect. This is entertainment, not a claim of scientific ecological accuracy.

Development is intended on a MacBook with VS Code. The eventual display is a Raspberry Pi connected to a screen and running a browser; its model, resolution and performance budget are not yet confirmed. Normal viewing must require no input. Optional development controls, diagnostics and configuration are welcome.

The intended stack is TypeScript, Vite and Babylon.js. Start with a browser application and avoid adding a backend, cloud services or other frameworks for hypothetical future needs.

## Scope

The first deliverable is a small autonomous scene: grassland, one watering hole and one placeholder herbivore that repeatedly becomes thirsty, travels to water and drinks while water replenishes. Make this cycle reliable and legible before expanding the ecosystem.

The longer-term world includes open plains, clusters of trees, sheltered areas and watering holes, with resources that are consumed and replenished. Animals may graze, drink, rest, travel, group, flee, hunt and reproduce. Births, ageing and deaths should eventually affect populations. These are ambitions, not current features.

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
| Overhead thirst/behaviour and pond supply indicators | `src/stats.ts`, `src/style.css` | DOM meters follow the animal; pond panel includes completed cycles. |

One block-built placeholder herbivore now seeks water, drinks, waits for replenishment when necessary, and returns to its resting spot. Thirst and available water are simulation state, independent of their visual representation. No backend, persistence or external assets have been added. The camera has no input controls.

Baseline validation on 22 October 2026 (before the autonomous milestone):

- Dependency installation completed successfully with no audit vulnerabilities reported at installation time; exact dependency versions are pinned and locked.
- `npm run build` passed, including `npm run check`, using Node 24.21.0 and npm 11.19.0.
- The Vite development server returned HTTP 200. Safari on the development Mac visibly rendered the grassland, sand bank and water, including after live reload and a window-size change.
- Browser inspection caught a ground dimension mapping error that type checking did not catch; it was corrected and visually rechecked before the final successful build.
- Vite reported a large-chunk warning: the main production JavaScript chunk is approximately 1.02 MB minified / 241 kB gzip. This is a download-size observation, not a frame-rate measurement.
- Browser console diagnostics, narrow portrait layouts, the WebGL failure path, production-preview rendering, Raspberry Pi performance and sustained unattended operation remain unverified. The earlier baseline did not include animal behaviour.

Autonomous milestone verification:

- `npm test`: all six focused checks passed, covering movement clamping, range/access/request guards, exact consumption, hydration limits, bounded resources, empty/unreachable recovery, repeated cycles and refill capacity.
- Equal two-minute simulated runs at 30 and 144 render updates per second produced identical state. A one-hour frame gap advanced only 250 ms of simulated time.
- `npm run build` passed with the existing large-chunk warning (main JavaScript approximately 1.03 MB minified / 244 kB gzip).
- Chrome on the development Mac completed four cycles without input over approximately two minutes with default configuration. Visual checks showed the animal at the bank waiting for replenishment, then seeking/returning in later cycles, with the overhead thirst label tracking its position. The pond began empty. No console warnings or errors were captured. Safari displayed the DOM but did not provide a rendered frame during this session; the current milestone is not verified in Safari.
- Pi performance, extended unattended reliability, portrait layout and production-preview rendering remain unverified.

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
- `src/simulation.ts`: plain state, movement, water accounting, behaviour and fixed-step clock.
- `src/ecosystem.ts`: connects simulation state to meshes and overhead DOM stats.
- `src/animal.ts`: reusable placeholder herbivore creation.
- `src/stats.ts`, `src/style.css`: overhead thirst/behaviour label, water supply panel and display styling.
- `tests/simulation.test.mjs`: focused simulation checks.
- `package.json`, `package-lock.json`, `tsconfig.json`: commands, dependencies and strict TypeScript configuration.

Meshes, materials and stat elements are created once. A fixed 1/60-second simulation step runs independently of rendering; the scene displays the resulting state. There are no shadows, textures, post-processing effects or downloaded assets. The rendering pixel ratio is capped at 1.5 as a provisional cost restraint, not a measured Pi performance guarantee.

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

Implemented with one placeholder herbivore. Its overhead label shows behaviour and thirst from 0–100% (higher means thirstier); the pond panel shows supply and completed drinking cycles.

Default rules in `src/simulation.ts`:

- Start with thirst 55 and an empty pond of capacity 100 water units.
- Thirst rises 3 points per simulated second, capped at 100. Seek water at 60 and finish drinking at 10.
- Travel at 2.4 scene units per simulated second to a radial bank point 0.75 units outside the water. Drink only outside the pond and within 0.85 units of its edge.
- Consume up to 12 water units per second; each water unit removes 4 thirst points. Consumption is capped by available stock and remaining need.
- Refill at 2 water units per second, capped at capacity. Replenishment happens before consumption each simulation tick.
- At an empty pond, wait and retry once per simulated second, resuming when at least 5 units are available. An inaccessible pond leaves the animal safely waiting; it can resume when accessibility is restored.
- Return to the starting resting spot after drinking, then repeat. This simple radial route assumes an unobstructed home outside the pond; obstacle avoidance is not implemented.
- Hidden tabs pause progression. Frames longer than 250 ms discard excess time to bound catch-up work; reopening the app resets the world. This is a reversible initial policy, not a save/resume or offline-progression commitment.

The water surface fades as supply falls; its bank and interaction radius stay fixed. The first cycle exercises water depletion and recovery. Configuration values are developer-owned and should remain finite with positive capacity, speed, hydration conversion and retry interval; the edge offset must fit within drinking range.

The implemented end-to-end loop:

1. Display grassland, one watering hole and one placeholder herbivore.
2. Increase the animal's thirst over simulated time, with explicit lower and upper bounds.
3. At a configured thirst threshold, select an accessible point at the water's edge and travel towards it.
4. Stop within the configured drinking range. Consume water only while in range.
5. Reduce available water by the amount actually consumed and reduce thirst according to an explicit conversion rule.
6. Replenish the pond at a configured rate per simulated second, capped at its capacity.
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
| 2. Grazing, hunger and resting | Add one need at a time; an animal switches sensibly between food, water and rest. | Check resource consumption, need bounds and priority conflicts; observe transitions without rapid switching. |
| 3. Multiple animals and local perception | Several animals choose nearby resources and interact visibly; add simple grouping only after selection works. | Check perception boundaries and resource contention without negative stock; measure increasing populations. |
| 4. Predators, fleeing and hunting | Prey respond to nearby threats and predators pursue with explicit success/failure rules. | Check detection, escape, pursuit termination and encounter outcomes in repeatable scenarios. |
| 5. Life cycles and populations | Births, ageing and deaths change population counts according to explicit rules. | Check lifecycle boundaries and counts, then run repeatable longer scenarios; apply the agreed collapse/replenishment policy. |
| 6. World and presentation | Add trees, shelter, animation, sound and visual polish incrementally while behaviour remains readable. | Inspect visuals and behaviour, track asset licences, and compare measured performance before and after each addition. |
| 7. Persistence and delivery | If approved, save/resume works and a chosen deployment supports unattended display. | Check save round trips and version handling; test browser restart, reload and sustained runs on the target Pi. |

Performance measurement and unattended-run checks begin at the runnable baseline and continue throughout; they are not deferred to the final stage. Simple visual polish can happen earlier when it improves clarity without blocking behaviour work.

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
| Save/resume | Defer persistence until the autonomous loop is stable, then consider a local snapshot if continuity is desired. This keeps the initial scope small. |
| Progression while the browser is closed | Initially evolve only while running. Offline catch-up or an always-running server needs an explicit product decision. |
| Population collapse versus migration/replenishment | Keep death out of the first demonstration. Later consider explicit, observable migration to sustain a living display, subject to approval; never silently replace animals. |
| Camera behaviour | Start with a fixed overview that keeps the animal and water visible. Consider gentle autonomous camera movement later; normal viewing should remain input-free. |
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
- Include a suggested git commit message at the end of each completed task; do not commit unless asked.

The next recommended implementation increment is grazing and hunger, introducing one new need and its resource before adding multiple animals. The app remains local-only; no hosting, deployment, push or commit is part of this increment.
