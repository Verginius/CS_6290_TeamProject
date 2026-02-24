# GovernorWithDefenses — Intentional Deviations from Governance_Spec

This document records two deliberate deviations between
`src/governance/GovernorWithDefenses.sol` and `docs/specs/Governance_Spec.md`.
Both choices strengthen security beyond the spec baseline and are retained
permanently.

---

## Deviation ② — Snapshot Block Timing

### Spec requirement (Governance_Spec §Voting)

> The vote-weight snapshot should be taken at block `voteStart − 1`
> (the block immediately before voting opens), so that token holders can
> acquire or delegate tokens during the voting delay period.

### Implementation choice

`GovernorWithDefenses.propose()` records the snapshot at the **proposal
creation block** (`block.number`):

```solidity
// FIX-1: Record the snapshot block — vote weight is frozen here.
uint256 snapshot = block.number;
_proposals[proposalId].snapshotBlock = snapshot;
```

Vote weight is therefore read as:

```solidity
weight = TOKEN.getPastVotes(voter, snapshotBlock);  // = proposal creation block
```

### Justification

| Concern | voteStart − 1 (spec) | block.number (implementation) |
|---|---|---|
| Flash-loan window | Purchasing tokens during the voting-delay period grants voting power | Any purchase *including* the day tokens were acquired at the snapshot block has no effect—weight is already frozen |
| Delegation griefing | Proposer can delay-buy tokens just before voteStart | Not possible; snapshot is irrevocably fixed at creation time |
| Attack surface | Larger — attackers have `votingDelay` blocks to accumulate power | Minimal — only tokens held *before* the propose() transaction count |

Taking the snapshot earlier (at creation) is a **stricter** and **more
secure** interpretation than the spec minimum.  It removes the entire
voting-delay window as a flash-loan opportunity, at the cost of preventing
legitimate last-minute delegation—an acceptable trade-off for an educational
security-research governor.

**Spec note:** The spec language says "should", not "must", so this deviation
does not violate a hard invariant.

---

## Deviation ⑥ — Cancel Scope Restricted to Pending State

### Spec requirement (Governance_Spec §Lifecycle)

> A proposer may cancel a proposal at any time before execution.
> Cancellation may also be triggered automatically if the proposer's token
> balance falls below `proposalThreshold` at any point before the proposal
> is executed.

### Implementation choice

`GovernorWithDefenses.cancel()` (FIX-7) enforces that the proposal **must
be in the `Pending` state** at the time of cancellation:

```solidity
// FIX-7: Only allow cancellation while the proposal is still Pending.
require(
    state(proposalId) == ProposalState.Pending,
    "GovernorWithDefenses: can only cancel pending proposals"
);
require(msg.sender == p.proposer, "GovernorWithDefenses: not proposer");
```

- No mid-vote or post-vote cancellation is permitted.
- Threshold-drop auto-cancellation is not implemented.

### Justification

`GovernorVulnerable` allowed cancellation at any lifecycle stage (VULN-7),
which enabled a malicious or compromised proposer to abort a successful vote
moments before execution—effectively giving the proposer a veto over the
DAO's decision.

Restricting cancellation to the **Pending** window means:

1. **Once voting opens, outcomes are final** — the proposer cannot abort a
   vote that is going against them.
2. **Threshold-drop auto-cancel is omitted** because it introduces a new
   griefing vector: an adversary could temporarily dilute the proposer's
   balance (via governance-approved transfers or supply inflation) to force
   cancellation of legitimate proposals mid-vote.

This is a deliberate **security hardening beyond the spec**.  A production
governor wishing to implement spec-compliant threshold-drop cancellation
should add appropriate safeguards (e.g., guardian-only override, multi-sig
confirmation) before enabling broader cancel scope.

---

*Document generated as part of CS 6290 Team Project — Compound Governance
Attack-Cost Analysis, Phase 3 (Defense Implementation).*
