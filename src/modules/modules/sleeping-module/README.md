# MOD0006 — Sleeping Module

The Sleeping Module is a physical bed with one sleeping position.

- The selected pawn must physically reach the built module on Z0.
- The module displays the selected pawn and offers one action: **SLEEP**.
- Starting sleep consumes all of that pawn's remaining AP; there is no separate activation cost or duration selector.
- The pawn is rendered lying in the bed and the module is occupied until NEXT TURN.
- A bed can be occupied by only one pawn at a time.
- Sleeping pawns have movement locked. They cannot receive ordinary movement or AP-action commands.
- At NEXT TURN, sleep hours restore rest at 1 point per hour, then the normal 3-point turn fatigue is applied. Rest is clamped to -30..15.
- The module does not own rest/fatigue rules; those remain in the shared pawn condition system.
- Exhausted pawns may also fall asleep on the floor during an AP action. They remain at that location, lying down and movement-locked until NEXT TURN or future rescue/carry behavior.
- Sleeping does not protect a pawn from pressure, atmosphere, temperature, damage, or other environmental systems.
