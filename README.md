# GriggyVannah

GriggyVannah is a stylised 3D savannah ecosystem designed to run by itself as a living display. Leave it running and watch animals respond to their needs, each other and a changing world, without controlling them. Prioritise an appealing, coherent world with observable cause and effect. This is entertainment, not a claim of scientific ecological accuracy.

Development is intended on a MacBook with VS Code. The eventual display is a Raspberry Pi connected to a screen and running a browser; its model, resolution and performance budget are not yet confirmed. Normal viewing must require no input. Optional development controls, diagnostics and configuration are welcome.

The intended stack is TypeScript, Vite and Babylon.js. Start with a browser application and avoid adding a backend, cloud services or other frameworks for hypothetical future needs.

## Scope

The first deliverable is a small autonomous scene: grassland, one watering hole and one placeholder herbivore that repeatedly becomes thirsty, travels to water and drinks while water replenishes. Make this cycle reliable and legible before expanding the ecosystem.

The longer-term world includes open plains, clusters of trees, sheltered areas and watering holes, with resources that are consumed and replenished. Animals may graze, drink, rest, travel, group, flee, hunt and reproduce. Births, ageing and deaths should eventually affect populations. These are ambitions, not current features.

## Current implementation and evidence

Repository inspection on 22 October 2026 found only `README.md` among tracked project files and no additional application files in the working tree. No applicable `AGENTS.md` was found. The previous README contained only the project title, retained above.

| Area | Status in this checkout |
| --- | --- |
| Project brief | Present in `README.md`. |
| TypeScript, Vite and Babylon.js application | Reported stack; no source, dependency manifest or configuration is present to verify it. |
| Canvas, camera, lighting, materials and resize handling | Reported previous work; implementation is unavailable here. |
| Separate `createGrassland` and `createPond` functions | Reported previous work; no definitions or source paths found. |
| Configurable pond sizes and positions | Reported previous work; unverified. |
| Watering-hole data and a `drink` function returning water consumed | Reported previous work; unverified, including guards for non-positive requests and unreachable water bodies. |
| Moving box or other animal placeholder | Completion unknown; no implementation found. |
| Autonomous behaviour, resource replenishment and simulation checks | Planned; absent from this checkout. |

**Verified:** the file inventory and absence of application configuration in this working tree. **Not verified:** any running scene or simulation behaviour. No application was executed, and no build or tests were run because there is no runnable project here. This does not establish whether earlier work exists in another checkout or revision.

Before implementing features, locate and preserve any recoverable previous application. If it is unavailable, establish only the minimal agreed browser stack needed for the first demonstration. Do not replace useful work if it is subsequently found. Update this section with real source paths and distinguish code inspection from runtime verification as code becomes available.

## Setup and commands

There are currently **no supported installation, development, checking or build commands** in this checkout. In particular, there is no `package.json`, lockfile, TypeScript configuration, Vite configuration or HTML entry point. Do not assume that `npm install`, `npm run dev`, `npm run check`, `npm test` or `npm run build` will work here.

For the eventual application, prerequisites will include a browser with support for the chosen Babylon renderer, a compatible Node.js version and the package manager selected by the recovered or newly established manifest and lockfile. Exact versions remain unspecified. VS Code is the intended editor, not a runtime dependency.

Once the application is available, document its actual prerequisites and scripts here, including:

- Dependency installation using its chosen package manager and lockfile.
- Starting the local development server and opening the URL it reports.
- Existing type, logic and other checking commands, with their distinct purposes.
- Building the browser application and, if supported, previewing the build.

Verify each command against the manifest before documenting it as supported. Record execution results separately: a successful build does not prove correct simulation behaviour.

## Architecture

### Existing structure

`README.md` is the entire visible project structure outside Git metadata. No application architecture can yet be confirmed. Names such as `createGrassland`, `createPond` and `drink` describe reported work, not verified modules.

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

## First autonomous demonstration — proposed

This milestone is not implemented in this checkout. Its prerequisite is recovering or establishing the minimal runnable application described above.

Build one end-to-end loop:

1. Display grassland, one watering hole and one placeholder herbivore.
2. Increase the animal's thirst over simulated time, with explicit lower and upper bounds.
3. At a configured thirst threshold, select an accessible point at the water's edge and travel towards it.
4. Stop within the configured drinking range. Consume water only while in range.
5. Reduce available water by the amount actually consumed and reduce thirst according to an explicit conversion rule.
6. Replenish the pond at a configured rate per simulated second, capped at its capacity.
7. Leave the drinking state when sufficiently hydrated, then allow the cycle to repeat without input.

Use explicit units and configuration for rates, thresholds and distances. For this simple scene, an edge point on open ground is enough; general pathfinding is not required. A small optional diagnostic view can expose thirst, water quantity and behaviour state to make cause and effect observable.

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
| 0. Runnable baseline | Recover prior work where available; grassland and a pond render and resize correctly. | Verify actual setup/build commands and inspect browser startup, canvas resize and console errors. |
| 1. Autonomous drinking | One herbivore completes the demonstration above. | Focused timing, movement, bounds and accounting checks; repeated browser cycles and empty-water recovery. |
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

The next recommended implementation increment is to recover or establish the minimal runnable baseline and then complete the one-herbivore autonomous drinking demonstration. No application implementation, dependency installation or deployment was performed as part of this documentation task.
