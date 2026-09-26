# ARCHITECTURE — Void Descent

## Goal

Keep the browser build simple to deploy while preventing the prototype from collapsing into a single unmaintainable script.

The project deliberately uses native ES Modules and static assets so Render can continue to serve it as a static site without a build pipeline.

## Current structure

```text
/
├── index.html
├── styles.css
├── game.js
├── render.yaml
├── GAME_DESIGN.md
├── ROADMAP.md
├── DEVLOG.md
├── ARCHITECTURE.md
└── src/
    ├── config/
    │   └── runtime.js
    ├── core/
    │   ├── math.js
    │   └── state.js
    ├── data/
    │   ├── biomes.js
    │   ├── enemies.js
    │   ├── encounters.js
    │   └── upgrades.js
    ├── render/
    │   └── background.js
    ├── systems/
    │   ├── director.js
    │   ├── hazards.js
    │   └── upgrades.js
    └── ui/
        └── elements.js
```

## Boundaries

### config/
Performance limits and feel constants. These should be declarative and side-effect free.

### core/
Small reusable engine primitives and state factories. This layer must not depend on game-specific UI.

### data/
Declarative content definitions: biomes, enemy stats, encounter templates and upgrade metadata. New content should increasingly be added here rather than as branches inside the runtime.

### systems/
Game rules that interpret data and mutate state. Upgrade effects, threat-budget encounter scheduling and ground-hazard simulation now live here.

### render/
Pure or mostly-pure visual rendering modules. The celestial background pass is the first extracted renderer.

### ui/
DOM binding and future menu/HUD helpers.

### game.js
Temporary orchestration layer. It still owns too much simulation and rendering logic. Its responsibility should gradually shrink toward lifecycle, input, frame update orchestration and system wiring.

## Rules for future refactors

1. Do not split code only to create more files; extract a unit when it has a clear boundary.
2. Prefer data definitions + interpreters over one-off branches.
3. Rendering modules receive the state they need rather than reading hidden globals.
4. Systems should be testable without a Canvas whenever practical.
5. Avoid introducing a bundler until native modules become a real limitation.
6. Preserve Render static-site compatibility.
7. Refactors should keep gameplay behavior stable unless the commit explicitly changes design.

## Next extraction targets

1. Entity rendering.
2. Combat/projectile simulation.
3. Player input and movement.
4. Upgrade/Constellation selection flow.
5. Local save schema.

## Validation baseline

After structural changes:
- parse every JavaScript module;
- verify every imported local module exists;
- verify DOM IDs used by the UI binding module exist in `index.html`;
- keep the game entrypoint loaded with `type="module"`;
- verify the static deployment path remains unchanged.
