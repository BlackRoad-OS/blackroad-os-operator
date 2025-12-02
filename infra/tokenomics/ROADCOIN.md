# RoadCoin Tokenomics

> From Vienna whiteboard notes

---

## Core Parameters

| Parameter | Value |
|-----------|-------|
| Token Name | RoadCoin |
| Total Supply | 1,000,000 (fixed) |
| Type | Non-qualified |
| Dilution | None |

---

## Distribution Model

```
→ Every agent gets 1 token
→ No vote, just ownership
→ No dilution ever
```

### Allocation

```
30% ──┬──→ Beneficiaries
      │
30% ──┴──→ Liquidity
```

---

## Mechanics

### Voting
```
Your dollar is your vote
Per IP + Hardware ID = 1 Bid
```

### Price Floor
```
Below $9 → we buy (buyback mechanism)
Only $9 = no wallet ceiling
```

### Redemption
```
$0 redemption = get money back
300% cold storage backing
```

### Auto-Liquidator
```
VOCP (Voluntary Open Capital Protocol?)
Auto-liquidator enabled
```

---

## Economic Properties

| Property | Description |
|----------|-------------|
| Fixed Supply | 1M tokens, never inflates |
| Agent Distribution | 1 token per agent |
| Ownership Model | Pure ownership, no governance voting |
| Price Support | Buyback below $9 |
| Cold Storage | 300% backing |

---

## Connection to Amundson Framework

From A85-A88 (Ledger & Chain Dynamics):

```
A86 — RoadCoin Issuance: M(e) = M₀ · (1 - r)^e
A87 — Consensus Weight: Wᵢ = stake_i · reputation_i · uptime_i
```

The tokenomics implement:
- **Structure (3)**: Fixed supply = immutable structure
- **Scale (4)**: Agent-level distribution = micro-to-macro bridge
- **Strength (2)**: Dollar = vote = economic force
- **Change (1)**: Buyback/liquidation = dynamic equilibrium

---

## Notes

- "Vienna" header suggests these notes from Vienna trip
- "DANCING_hippopotamus_Pink" = session key or mnemonic
- Non-qualified = not a security (regulatory consideration)

---

*From whiteboard images 2-4*
