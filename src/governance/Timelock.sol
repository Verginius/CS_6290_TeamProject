// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title Timelock
 * @dev Thin wrapper around OpenZeppelin's TimelockController used as the
 *      execution layer of GovernorBase.
 *
 * ============================================================
 * ROLE IN THE GOVERNANCE SYSTEM
 * ============================================================
 *
 * All proposals that pass a GovernorBase vote are queued here before
 * they can be executed.  The mandatory delay gives token holders time
 * to review, exit, or veto (via Guardian roles) before on-chain state
 * is permanently changed.
 *
 * ============================================================
 * ROLE CONFIGURATION (set by DeployGovernance script)
 * ============================================================
 *
 * PROPOSER_ROLE  — granted to GovernorBase; allows it to schedule
 *                  operations after a successful vote.
 * EXECUTOR_ROLE  — granted to address(0), meaning anyone may trigger
 *                  execution once the timelock delay has elapsed.
 * CANCELLER_ROLE — granted to GovernorBase; allows emergency cancellation
 *                  of queued operations.
 * DEFAULT_ADMIN  — revoked from the deployer after setup so that the
 *                  Timelock itself becomes the sole administrator.
 *
 * ============================================================
 */
contract Timelock is TimelockController {
    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Creates the timelock with the given parameters.
    /// @param minDelay   Minimum delay (seconds) before a queued operation can execute.
    /// @param proposers  Addresses allowed to schedule operations.
    /// @param executors  Addresses allowed to execute ready operations.
    /// @param admin      Address that may grant / revoke roles at deployment.
    constructor(uint256 minDelay, address[] memory proposers, address[] memory executors, address admin)
        TimelockController(minDelay, proposers, executors, admin)
    {}
}
