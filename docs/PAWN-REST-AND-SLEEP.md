# Pawn rest and MOD0006 Sleeping Module

## Pawn condition

Every pawn owns:
- `rest`: integer clamped to -30..15; new pawns start at 15.
- `pendingSleepHours`: hours scheduled through a Sleeping Module for the current turn.

Rest states:
| Rest | State | AP-action failure chance |
|---:|---|---:|
| 0 to 15 | Well Rested | 0% |
| -1 to -15 | Deprived | 20% |
| -16 to -30 | Exhausted | 50% |

At NEXT TURN, resolve:
`rest = clamp(rest - 3 + pendingSleepHours, -30, 15)`
Then clear `pendingSleepHours`. The baseline loss is 3 rest points per 12-hour turn (6 per in-game day).

## Action reliability

Every AP-consuming action uses the shared pawn action system:
- Check available AP.
- Add the pawn rest failure chance to any separately supplied malfunction chance.
- Clamp the combined chance to 100%.
- Spend the action's AP whether it succeeds or fails.
- Execute the action effect only on success.

The power/malfunction system is not yet implemented. The shared resolver accepts a malfunction chance so that a future powered-module action can combine it additively with rest-related failure without duplicating the rule.

Movement does not spend AP and is not checked for rest-related action failure.

## MOD0006 Sleeping Module

- Physical interaction on Z0; the pawn must navigate to a working position beside the built module.
- No bed animation, occupant slot, or physical lying-down simulation.
- Activation costs 1 AP and is subject to pawn action reliability.
- After successful activation, the player selects 1..remaining AP hours, with a maximum of 11 hours at full AP.
- The selected sleep hours also consume AP.
- The hours are stored on the pawn and resolved at NEXT TURN.
- The module does not own rest, fatigue, or their consequences.

## Later UI work

After the Sleeping Module is tested and stable, add a dedicated Pawn Info menu showing rest and other pawn attributes. It is intentionally not part of the initial module implementation.
