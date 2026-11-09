# Pawn Rest, Sleep and MOD0006

## Pawn-owned condition state

Every pawn owns:
- `rest`: integer clamped to -30..15; all newly created pawns start at +15.
- `sleepState`: `AWAKE` or `SLEEPING`.
- `sleepHoursThisTurn`: AP converted into sleep hours for the current turn.
- `sleepLocation`: visible world position where the pawn is lying down.
- `sleepingInModuleId`: occupied bed object ID, or null for floor sleep.
- `sleepWakePosition`: walkable position to restore after sleeping in a bed.
- `sleepForced`: whether sleep was caused by exhaustion.

Rest states:
| Rest | State | Behavior during an AP action |
|---:|---|---|
| 0 to 15 | Well Rested | No rest-related penalty |
| -1 to -15 | Deprived | 20% chance the action fails; its AP is spent |
| -16 to -30 | Exhausted | 50% chance the pawn falls asleep immediately |

If an Exhausted pawn does not fall asleep during an AP action, the action proceeds normally. Exhausted does not also receive the Deprived 20% failure roll. Independent malfunction chances remain a separate layer.

When an Exhausted pawn falls asleep during an action:
- The attempted action does not execute.
- All remaining AP are consumed.
- The pawn remains physically at the current position and is rendered lying on the floor.
- Movement and further actions are locked until NEXT TURN or a future carry/rescue action.

## Sleep and rest resolution

One AP represents one hour. Starting sleep converts all remaining AP into sleep hours and sets AP to zero.

At NEXT TURN:
`rest = clamp(rest - 3 + sleepHoursThisTurn, -30, 15)`

Then the pawn wakes, sleep state and sleep location are cleared, and AP is restored to max. Baseline rest loss is 3 points per 12-hour turn (6 per in-game day).

## MOD0006 Sleeping Module

- Physical interaction on Z0; pawn must navigate to the built module.
- The module is a physical bed with capacity one.
- The module displays the currently selected pawn and offers only SLEEP.
- There is no duration selector and no separate activation AP cost.
- SLEEP consumes all remaining AP and places the pawn visibly lying in the bed.
- The bed remains occupied until NEXT TURN.
- A sleeping pawn cannot move or perform actions.
- Sleeping does not protect against low pressure, vacuum, temperature, damage or other environment effects.
- If the pawn falls asleep from Exhausted outside a bed, it remains lying at that floor position until NEXT TURN or future rescue/carry behavior.

## Pawn Info

The dedicated Pawn Info panel exposes rest and sleep state, alongside level, health, AP and location. It opens by clicking the visible pawn once to focus the camera, then clicking the pawn again while the camera is focused.

The compact crew card and status sidebar also expose the current condition and sleep state.
