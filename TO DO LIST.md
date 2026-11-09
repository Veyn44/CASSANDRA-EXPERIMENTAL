# CASSANDRA — TO DO LIST

# STEP 1 — ALUMINIUM WALL DEPENDENCIES & TECHNICAL DECK SYNCHRONIZATION

**Status: PLANNED — NOT IMPLEMENTED**

## Goal

Extend the existing Aluminium Wall role so that every module depends on an adjacent Aluminium Wall, and make the existing technical decks reflect Aluminium Wall positions on their parent decks. Preserve the current technical-deck generation model; this step adds synchronization and construction/deconstruction rules rather than replacing the system.

## 1.1 Universal module dependency on Aluminium Wall

- [ ] Every buildable module must be placed directly adjacent to at least one Aluminium Wall.
- [ ] A module cannot be constructed if it has no adjacent Aluminium Wall.
- [ ] Apply this rule to all modules, not only the Control Panel. The Control Panel's existing adjacency/orientation behaviour must continue to work.
- [ ] Use the existing Control Panel adjacency convention; adjacency is orthogonal (four cardinal directions), not diagonal.
- [ ] Apply the rule consistently to every relevant placement/construction path.
- [ ] Preserve Aluminium Wall's existing roles as an electrical/conduit distributor and structural/service element. This change extends its role; it does not replace existing behaviour.

## 1.2 Safe Aluminium Wall demolition

- [ ] Before demolishing an Aluminium Wall, check whether any module would be left without an adjacent Aluminium Wall.
- [ ] Reject demolition if it would leave a module without any valid adjacent Aluminium Wall.
- [ ] The player must first move or demolish the dependent module, or provide another adjacent Aluminium Wall.
- [ ] Allow demolition when every affected module will still have at least one other adjacent Aluminium Wall.
- [ ] Apply the dependency check to every relevant demolition path, including DEV tools where they are expected to respect normal game rules. Any intentional DEV-only bypass must be explicit and documented.

## 1.3 Existing technical-deck structure — preserve it

- [ ] Keep the existing technical-deck generator and its full-footprint model. Do not replace it with sparse tunnels, shortest-path routing, or player-built corridors.
- [ ] Technical decks remain full, non-buildable, read-only structural spaces.
- [ ] Technical-deck geometry follows its parent deck: **Z+1 follows Z+2**, and **Z−1 follows Z0**.
- [ ] Z−2 is itself a technical deck and does not generate another technical level.
- [ ] The five-level arrangement remains Z+2, Z+1, Z0, Z−1, and Z−2.
- [ ] Z0 remains the base reference for the ship footprint; Z+1 and Z−1 derive their geometry through their respective parent decks as specified above.
- [ ] Keep the existing central access shaft **1×1 at coordinates (64,64)**.

## 1.4 Aluminium Wall → technical-deck tile synchronization

- [ ] Inspect Aluminium Wall positions on the parent deck during technical-deck synchronization.
- [ ] For every Aluminium Wall on Z+2, remove the technical-deck tile at the same coordinate on Z+1.
- [ ] For every Aluminium Wall on Z0, remove the technical-deck tile at the same coordinate on Z−1.
- [ ] Keep this mapping synchronized when Aluminium Walls are built or demolished on the parent deck.
- [ ] Do not change the parent-deck Aluminium Wall or its parent tile as a side effect of removing the corresponding technical-deck tile.
- [ ] Preserve unrelated technical-deck content and entities when synchronizing geometry; do not silently erase content that is not part of the derived floor tile.
- [ ] Do not apply this derived-tile removal rule to Z−2.

## 1.5 Integration and verification

- [ ] Verify that all modules are blocked from construction without an adjacent Aluminium Wall.
- [ ] Verify that modules can be placed next to a valid Aluminium Wall in each supported orthogonal direction.
- [ ] Verify that an Aluminium Wall cannot be demolished if a module would lose its last adjacent Aluminium Wall.
- [ ] Verify that demolition is allowed when a dependent module retains another adjacent Aluminium Wall.
- [ ] Verify that Z+1 removes tiles exactly under Aluminium Walls on Z+2.
- [ ] Verify that Z−1 removes tiles exactly under Aluminium Walls on Z0.
- [ ] Verify that building and demolishing parent-deck Aluminium Walls updates the corresponding technical-deck geometry.
- [ ] Verify that Z−2 remains unaffected by this synchronization rule.
- [ ] Verify that the 1×1 shaft remains at (64,64).
- [ ] Review interactions with section detection, electrical/conduit distribution, rendering, navigation, and DEV tools.
- [ ] Fetch the changed source files from GitHub after implementation and perform static verification; separately report whether browser/gameplay testing has been performed.

## Scope boundary

This step covers only the Aluminium Wall module dependency, safe Aluminium Wall demolition, and the corresponding technical-deck tile synchronization described above. Other mechanics and future steps are intentionally not included here.

---

# STEP 2 — BASIC SHIP SYSTEMS, SURVIVAL & ELECTRICAL NETWORK

**Status: PLANNED — DESIGN AGREED, NOT IMPLEMENTED**

## Goal

Complete the basic ship systems and integrate them into the turn simulation. The ship is a scientific exploration vessel. Preserve the existing simplified atmosphere, pressure and temperature model; implement the gameplay consequences and the connected power, lighting, visibility and survival systems described below.

## 2.1 Solar power, electrical distribution & batteries

### Solar generation

- [ ] Implement power generation for the existing Solar Panel (3×2 tiles).
- [ ] One tile represents 2×2 m (4 m²); one Solar Panel therefore has an active surface of 6×4 m (24 m²).
- [ ] Use approximately 1,361 W/m² solar irradiance at 1 AU and a fictional panel efficiency of 70% as the reference calculation.
- [ ] Reference output per panel at 1 AU: approximately 22.9 kW.
- [ ] One turn represents 12 hours. Reference generation per panel in uninterrupted ideal sunlight: approximately 274.4 kWh per turn.
- [ ] The starting ship may have two Solar Panels: approximately 45.8 kW and 548.8 kWh per 12-hour turn at 1 AU, before consumption.
- [ ] Scale generation with available solar irradiance. For example, at 10% of the 1-AU reference irradiance, one panel produces approximately 2.29 kW (27.4 kWh per 12-hour turn).
- [ ] Preserve the existing Aluminium Beam placement system for Solar Panels in vacuum.
- [ ] Aluminium Beams do not consume ship tile capacity.

### Electrical distribution

- [ ] Aluminium Walls contain the electrical conductors; do not implement separate cables or individual wire objects.
- [ ] Aluminium Walls form the ship's electrical distribution network.
- [ ] Modules connect to the network through adjacent Aluminium Walls, using orthogonal adjacency.
- [ ] The network must be able to identify whether a module has a conducting route to its section's Control Panel.
- [ ] Allow players to build multiple parallel routes as redundant power paths. These routes consume valuable construction space.
- [ ] If at least one valid, non-malfunctioning route remains, the module can use that route normally.
- [ ] Define and implement the power consumption of individual modules.
- [ ] Connect powered modules to the electrical network.

### Batteries

- [ ] Implement Battery Storage (2×2 tiles).
- [ ] Reference battery capacity: 20 MWh (20,000 kWh).
- [ ] Implement battery charging and discharging.
- [ ] Distinguish power (kW) from stored/generated energy (kWh/MWh).
- [ ] Define maximum battery charge and discharge power in a later balancing/design pass; capacity alone does not define these limits.
- [ ] Define and implement behaviour when generated and stored power is insufficient or unavailable.
- [ ] A possible jump cost of 10 MWh is an example only, not a final approved value.

## 2.2 Atmosphere, pawn survival & environmental effects

**Preserve the current simplified pressure, temperature and atmosphere model. Do not redesign its underlying rules in this step.**

- [x] Closed-section detection and section separation.
- [x] Existing atmosphere, pressure and temperature state model.
- [x] Control Panel shuts down when its section is in vacuum.
- [x] In optimal / not-optimal conditions, the Control Panel continues attempting to maintain the section state.

### Pawn condition

- [ ] Pawn occupies a 1×1 tile.
- [ ] One turn represents approximately 12 hours; the existing 12 AP per turn remains the action budget.
- [x] Starting pawn Veyn has 20 / 20 HP; future pawn creation will define its own health maximum.
- [ ] Any environment outside OPTIMAL can cause health loss. Damage depends on pressure, atmosphere and temperature.
- [ ] Exact HP damage rates for each environmental state remain to be balanced and specified.
- [ ] At 20 HP or less (20% of base maximum health), the pawn enters `INCAPACITATED`.
- [ ] An incapacitated pawn cannot perform actions or recover independently; it requires rescue.
- [ ] The rescue timer starts only when the pawn first crosses the incapacitation threshold, not merely when exposure begins.
- [ ] In LOW PRESSURE or NOT OPTIMAL ATMOSPHERE, allow one full following turn for rescue.
- [ ] In VACUUM, if the player ends the current turn while the pawn is incapacitated, the pawn dies.
- [ ] EXTREME TEMPERATURE shortens the rescue window according to severity; exact timing remains to be specified.
- [ ] Vacuum has the highest danger priority.
- [ ] Rescue can be achieved by restoring a safe environment, moving the pawn to a safe section, or using another entity/robot. Future medical systems may also support rescue.

### Control Panel and vacuum

- [x] A Control Panel in a vacuum section shuts down.
- [ ] When the Control Panel shuts down because its section is in vacuum, electrical power to the entire section is shut off.
- [ ] A light located in a vacuum room is completely off.

## 2.3 Wall Lights

- [ ] Wall Light occupies 1×1 tile.
- [ ] A Wall Light can be placed only adjacent to an Aluminium Wall.
- [ ] Placement uses cardinal adjacency and orientation, following the existing Control Panel orientation convention.
- [ ] Render the light asset on the edge of the tile beside the wall; light projects away from the wall into the room.
- [ ] Light radius: 5 tiles.
- [ ] Calculate radius separately from line of sight: being within radius does not illuminate a tile if an obstacle blocks the light.
- [ ] Walls and modules block light.
- [ ] Closed doors block light; open doors allow light to pass.
- [ ] Connect Wall Lights to the electrical network and power consumption.
- [ ] A Wall Light in a vacuum room is completely off.
- [ ] If a Wall Light is supplied through a malfunctioning electrical route, replace continuous illumination with random flickering:
  - One flicker cycle lasts 4 seconds.
  - Each cycle contains 1 or 2 flashes.
  - If there are 2 flashes, they are separated by 0.5 seconds.
  - After the flash or flashes, the light remains off until the next 4-second cycle.
- [ ] Keep the flicker effect as a visual real-time effect; it does not replace the underlying power/network state.

## 2.4 Ship visibility & Fog of War

- [ ] Ship interior is not automatically visible; visibility depends on illumination.
- [ ] Keep three distinct visibility/rendering layers:

  **A. Ship construction geometry**
  - Ship outline, deck geometry, hull and walls remain visible regardless of lighting.

  **B. Static objects**
  - Modules, furniture, doors and Wall Lights are normally visible when illuminated.
  - Static objects in previously seen but currently dark rooms may remain as muted silhouettes or last-known representations. The exact memory presentation remains to be finalized.

  **C. Moving entities**
  - Pawns, crew, robots and other moving entities are visible only while currently illuminated.
  - When an area becomes dark, moving entities disappear immediately, even if they were seen there before.

- [ ] When power or lighting is lost, update current visibility accordingly.
- [ ] Preserve ship construction geometry during power loss.
- [ ] Static objects may remain as dim remembered silhouettes in previously seen areas.
- [ ] Moving entities disappear from view as soon as their area is no longer illuminated.

## 2.5 Aluminium Wall degradation & electrical malfunctions

### Aluminium Wall as integrated wiring

- [ ] Aluminium Wall contains its own electrical conductor; do not add separate wire/cable entities.
- [ ] Build the power network from connected Aluminium Wall paths and module adjacency.
- [ ] Permit redundant parallel routes so a damaged wall does not necessarily disable a module if another healthy route exists.
- [ ] Redundant routes consume ship construction space and therefore create a meaningful layout trade-off.

### Damage and malfunction

- [ ] An Aluminium Wall with integrity **below 90%** is electrically malfunctioning.
- [ ] A module whose only available electrical route passes through a malfunctioning Aluminium Wall can still be used, but each attempted machine action has a fixed **50% chance to fail**.
- [ ] On a failed attempt, the AP cost is still consumed but the action does not execute.
- [ ] This gives an average of approximately twice the AP cost for successful machine actions while the only available route remains malfunctioning.
- [ ] If a module has at least one healthy alternative route, it uses that route and operates normally.
- [ ] Repairing the damaged Aluminium Wall restores its electrical conduction when integrity is back at or above the healthy threshold.
- [ ] Do not expose exact Aluminium Wall integrity continuously to the player.

### Inspection and diagnosis

- [ ] Wall integrity can be inspected through a Control Panel action that costs AP; whether this inspection also consumes energy remains to be specified.
- [ ] A robot assistant may alternatively inspect a wall by physically travelling to it; the inspection may occupy up to one full turn.
- [ ] Failed machine actions and abnormal light flicker can act as indirect symptoms of electrical damage.

## 2.6 Doors

- [x] Existing door objects and placement.
- [ ] Implement open / close interaction.
- [ ] Account for door state in section detection.
- [ ] Account for open doors when evaluating pressure and atmosphere.
- [ ] Verify interaction between doors and pawn movement.
- [ ] Account for door state in Wall Light line of sight: closed doors block light; open doors allow light to pass.

## 2.7 EVA

- [x] Basic EVA implementation exists.
- [ ] Add gameplay properties to EVA.
- [ ] Define conditions required to exit the ship.
- [ ] Define EVA equipment properties and protection.
- [ ] Connect EVA to pawn condition and survival.
- [ ] Verify movement outside the ship and returning aboard.

## 2.8 Turn simulation — system integration

- [x] Basic NEXT TURN system exists.
- [ ] Audit the current turn-resolution order.
- [ ] Verify solar power generation against available irradiance.
- [ ] Verify electrical distribution, redundant routes and module power consumption.
- [ ] Verify battery charging and discharging.
- [ ] Verify Control Panel behaviour, including full-section power shutdown in vacuum.
- [ ] Verify environmental effects on pawns and modules.
- [ ] Verify malfunction chance and AP consumption for failed machine actions.
- [ ] Verify wall-light flicker, lighting and Fog of War during turn resolution and real-time rendering.
- [ ] Verify doors and EVA during turn resolution.
- [ ] Ensure systems update consistently and in a valid order.

## 2.9 Basic ship integration test

- [ ] New Game creates the basic ship with the correct modules and systems.
- [ ] Solar Panels generate power according to irradiance.
- [ ] Power is distributed through Aluminium Wall paths.
- [ ] A healthy redundant route keeps a module operating normally when another route is damaged.
- [ ] A module with only a malfunctioning route has a 50% failed-action chance and still consumes AP on failure.
- [ ] Batteries store surplus power and cover power shortages within their defined power limits.
- [ ] Control Panel responds to section conditions and shuts down all power in its section when in vacuum.
- [ ] Pawns respond to unsuitable environmental conditions and incapacitation/rescue rules.
- [ ] Wall Lights illuminate according to radius and line of sight.
- [ ] Damaged electrical routes cause the specified light flicker.
- [ ] Fog of War distinguishes construction geometry, static objects and moving entities.
- [ ] Doors work as interactive objects and affect light/section boundaries.
- [ ] EVA works as a gameplay mechanic.
- [ ] NEXT TURN correctly resolves all integrated systems.

## Open design values — do not guess during implementation

- [ ] Exact HP damage rates for each environmental condition.
- [ ] Exact shortened rescue window for extreme temperature.
- [ ] Exact power consumption for each module.
- [ ] Battery maximum charge/discharge power.
- [ ] Exact battery inspection energy cost, if any.
- [ ] Exact memory/last-known rendering for static objects in dark rooms.
- [ ] Exact integrity restoration target and repair behaviour.
- [ ] Any complete electrical disconnection threshold, if one is later desired; the currently agreed malfunction threshold is below 90%.

## Scope boundary

This step covers the basic ship systems and gameplay consequences listed above: solar power, Aluminium Wall electrical distribution, batteries, pawn survival, Wall Lights, ship visibility, doors, EVA and their integration into NEXT TURN. The existing simplified atmosphere, pressure and temperature model remains unchanged. Open design values must be specified before implementation; do not invent values while coding.


## Pawn condition and Sleeping Module

- [x] Add pawn-owned `rest` state with range -30..15; new pawns initialize at +15.
- [x] Resolve baseline rest loss of 3 points per 12-hour turn and physical sleep at NEXT TURN.
- [x] Deprived: 20% AP-action failure; Exhausted: 50% forced sleep chance during AP actions.
- [x] Exhausted pawns that do not fall asleep execute the attempted action normally.
- [x] Combine independent malfunction and Deprived failure chances additively, capped at 100%.
- [x] Route Z0 and technical-deck section scans, construction and repair AP actions through the shared pawn action system.
- [x] Implement physical MOD0006 bed interaction with one occupant, all remaining AP converted to sleep, visible lying pose and movement lock.
- [x] Add Pawn Info panel with two-stage focus/click interaction.
- [x] Show rest/sleep status in the sidebar and crew cards; condition frames use normal/deficit/critical severity.
- [ ] Manually test bed occupancy, visible sleep pose, floor sleep, movement lock, NEXT TURN wake and rest resolution.
- [ ] Implement physical carry/rescue by another entity for sleeping pawns.
- [ ] Implement power-route malfunction detection and pass its chance into the shared action reliability system.
