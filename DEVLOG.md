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
