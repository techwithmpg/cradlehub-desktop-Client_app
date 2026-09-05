# Source of Truth

## Owner authority

1. Latest explicit owner instruction for the desktop project
2. Accepted greenfield ADRs
3. Active greenfield governance/current-state docs
4. Accepted implementation on desktop `main`

Historical desktop material never outranks active greenfield truth.

## Hosted business/domain truth

1. Independently verified current production behavior when available
2. Current hosted server/data contracts
3. Current hosted repository implementation
4. Desktop module contract
5. Desktop implementation

Repository implementation must be labelled as repository evidence when deployed behavior has not been independently verified.

## UI truth

1. Owner-approved current reference PNG set
2. Shared desktop UI rules
3. Module contract
4. Current accepted desktop implementation

Reference PNGs define hierarchy/intent, not fake data or business authority.

## Delivery truth

1. `docs/50-state/CURRENT_STATE.md`
2. `docs/50-state/CURRENT_TASK.md`
3. `docs/50-state/LAST_VERIFIED_GATE.md`
4. current authorized stage gate
5. accepted desktop `main`

## Conflict rule

Never silently reconcile a material conflict.

Stop, identify the conflict, gather evidence, and obtain/record the required decision.
