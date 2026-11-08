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