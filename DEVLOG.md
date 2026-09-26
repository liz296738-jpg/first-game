# DEVLOG — Void Descent

## 2026-09-26 — Project foundation

- GitHub repository connected: `liz296738-jpg/first-game`.
- Defined the project as a long-term polished browser survivor-like rather than a rapid MVP.
- Established the original **Celestial Ruin / 星骸美学** direction.
- Added design principles based on public genre research without copying protected assets or distinctive expressions.
- Added staged roadmap.
- Development cadence: incremental, testable changes; do not commit merely to satisfy a schedule.

## 2026-09-26 — Playable baseline + Visual Pass 01

- Imported the playable Canvas prototype into the repository.
- Preserved and surfaced existing systems including ranged enemies, elites/Boss logic, orbit blades, nova, drones, shield mechanics and sector variation.
- Rebuilt the shell UI into a restrained glass / celestial HUD.
- Added layered star parallax, procedural nebula haze, distant celestial ruins / orbital structures, eclipse imagery, dust and navigation filaments.
- Reworked the player silhouette into an oriented star-frame with thruster flame, core glow and shield language.
- Reworked enemy silhouettes so basic, swift, brute, caster, elite and boss units are visually distinguishable.
- Added richer projectile streaks / trails and improved combat particles.
- Added build/stage presentation to the HUD.
- Added Render static-site Blueprint configuration.
- Validation completed:
  - `node --check game.js`
  - HTML ↔ JavaScript DOM ID consistency check
  - local static-server requests for `index.html`, `styles.css`, `game.js`, and `render.yaml` returned HTTP 200
  - GitHub Actions assembly/validation run completed successfully before the final source commit
- Main-branch playable baseline commit: `86ed58ac51ae04710c858058df935050718f86bd`.

### Next
- Refactor the monolithic runtime into maintainable modules.
- Add debug/performance counters and effect budgets.
- Continue Visual Pass 02 with impact rings, camera drift, death dissolve and controlled screen-shake.


## 2026-09-26 — Alpha 0.3 movement & readability pass

- Replaced instantaneous movement with responsive acceleration/deceleration.
- Added Phase Dash on Space/Shift with cooldown, brief invulnerability, mobile control, screen feedback and afterimages.
- Added edge spawn warnings before enemies materialize.
- Added committed aim/wind-up telegraphs for caster and boss ranged attacks so dodging the warning is rewarded.
- Added an F3 diagnostics overlay for FPS, enemy, projectile and FX counts.
- Updated the HUD with dash readiness/cooldown feedback.
- Re-validated the committed GitHub `game.js` with the JavaScript parser after the changes.

### Next
- Add enemy separation and contact knockback.
- Define hard entity/VFX budgets and degradation behavior.
- Begin Encounter Director work so difficulty comes from compositions rather than spawn-rate inflation.


## 2026-09-26 — Alpha 0.3 runtime budget & collision pass

- Added a spatial-grid enemy separation pass so dense hordes preserve readable silhouettes instead of collapsing into a single blob.
- Added contact knockback so damage produces spatial consequence instead of feeling like a silent HP subtraction.
- Added hard runtime caps for enemies, spawn warnings, player/enemy projectiles, particles, rings, damage text and dash afterimages.
- Surfaced budget usage in the F3 diagnostics panel.
- Re-validated the committed `game.js` with the JavaScript parser after the update.

### Next
- Introduce an Encounter Director with authored enemy compositions and threat budgets.
- Add a controlled impact-ring pass and screen-shake budget.
- Begin modularizing the monolithic runtime before content growth accelerates.


## 2026-09-26 — Alpha 0.4 encounter director & controlled impact

- Replaced the old continuously accelerating random spawner with a two-layer pacing model:
  - low-intensity ambient pressure;
  - authored encounter packs driven by a threat budget.
- Added seven encounter archetypes: drift line, needle pincer, bulwark screen, crossfire, spearhead, closing net and elite anchor.
- Encounter composition now grows through a bounded threat budget based on run time and player level instead of relying primarily on spawn-rate inflation.
- Added staggered spawn scheduling so formations arrive as readable events rather than appearing in a single frame.
- Boss presence temporarily suppresses normal encounter scheduling to preserve encounter hierarchy.
- Added impact rings on significant hits and restrained critical-hit camera feedback.
- Added a hard screen-shake ceiling and centralized shake handling.
- Added very subtle ambient camera drift to improve the living-wallpaper feel without interfering with aiming/readability.
- Updated F3 diagnostics to expose the active encounter and its current threat budget.
- Re-validated the committed GitHub `game.js`: JavaScript parser check passes.

### Next
- Add the first readable ground-hazard framework.
- Begin splitting the monolithic runtime into maintainable data / simulation / rendering sections.
- Add VFX quality settings and a reduced-effects path before effect density increases further.


## 2026-09-26 — Alpha 0.4 reusable ground-hazard framework

- Added the first reusable ground danger primitive: a telegraphed Rift Zone.
- Rift Zones have a clear wind-up, active danger phase, bounded repeated damage and dash/invulnerability interaction.
- Added a restrained ambient scheduler after the opening section of a run so movement pressure increases without simply increasing enemy HP.
- Hazard frequency backs off during boss pressure to protect encounter readability.
- Added a one-time onboarding toast for the first Rift Zone.
- Added a hard hazard-count budget and surfaced hazard usage in F3 diagnostics.
- Re-validated the committed GitHub `game.js`: JavaScript parser check passes.

### Next
- Modularize the single-file runtime before more content is added.
- Add reduced/standard/high VFX quality paths.
- Add boss/biome-driven background response and player death dissolve.
- Then move into the data-driven upgrade/Constellation foundation.


## 2026-09-26 — Alpha 0.5 modular foundation + Constellation data

- Switched the browser entrypoint to native ES Modules without adding a build tool.
- Extracted runtime budgets/feel constants, biome data, enemy data, encounter templates, math helpers, DOM bindings, state factories and the celestial background renderer from the monolithic runtime.
- Reduced the main `game.js` from roughly 76 KB before this refactor pass to about 60 KB while preserving current gameplay.
- Added `ARCHITECTURE.md` to define module boundaries and future extraction rules.
- Converted upgrades from inline anonymous mutation callbacks into declarative data + a shared effect interpreter.
- Added the five Constellation affinities: Solar / Lunar / Void / Aether / Machine.
- Player state now tracks per-run affinity investment.
- Upgrade cards now surface affinity identity, and the HUD includes a compact Constellation Circuit strip showing investment across all five families.
- Intentionally deferred Resonance/Keystone effects until they can be designed as true rule changes rather than rushed stat bonuses.
- Validation:
  - every current JS module parses after import/export stripping;
  - all 30 DOM bindings resolve to IDs present in `index.html`;
  - the game entrypoint is loaded as `type="module"`.

### Next
- Extract Encounter Director and ground-hazard simulation into systems modules.
- Add VFX quality levels and reduced-effects accessibility path.
- Design the first 3–5 true Resonances before implementing them.


### Alpha 0.5 structural follow-up

- Encounter Director and Rift Zone simulation were moved out of `game.js` into dedicated systems modules.
- The main runtime is now about 53 KB, down from roughly 76 KB before the modularization pass.
- Current extracted layers now include:
  - config: runtime/VFX budgets;
  - core: math + state factories;
  - data: biomes, enemies, encounters, upgrades;
  - systems: upgrades, encounter director, hazards;
  - render: celestial background;
  - ui: DOM bindings.
- Re-validated the changed runtime/system modules: parser checks pass.
- Re-validated all 30 UI bindings against `index.html`: no missing IDs.


## 2026-09-26 — Alpha 0.6 rendering, quality & Resonance pass

- Extracted entity, hazard, spawn-warning, player and canvas-HUD rendering into `src/render/entities.js`.
- Main `game.js` is now roughly 43 KB after this pass, down significantly from the ~76 KB monolith before modularization.
- Added persistent VFX quality modes: Reduced / Standard / Cinematic.
- VFX modes materially change background density, effect budgets and screen-shake intensity and persist through local storage.
- Added boss-state environmental response so major encounters alter the background composition instead of only adding a large enemy.
- Implemented the first three gameplay-changing Constellation Resonances:
  - Corona Repeater — Solar 3 + Machine 2;
  - Moonstep Mantle — Lunar 3 + Aether 2;
  - Blackstar Rupture — Void 3 + Solar 2.
- Resonance unlocks are surfaced with dedicated banner/toast feedback and active Resonance count appears in the build HUD.
- Added `RESONANCES.md` to define design quality rules and future candidates.
- Validation:
  - changed JS modules parse successfully;
  - all 31 current DOM bindings resolve;
  - ES Module entrypoint remains intact.

### Next
- Extract combat/projectile simulation.
- Extract player input/movement.
- Add player death dissolve.
- Playtest and tune the first three Resonances before expanding the pool.
