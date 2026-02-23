// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { TimelockController } from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title Timelock
 * @dev Timelock controller for the governance system.
 * Delays the execution of proposals to allow users to exit if they disagree with the decision.
 */
contract Timelock is TimelockController {
    /**
     * @dev Sets up the timelock with a minimum delay, proposers, and executors.
     * @param minDelay The minimum delay in seconds before an operation can be executed.
     * @param proposers The list of addresses that can propose operations.
     * @param executors The list of addresses that can execute operations.
     * @param admin The address that can grant and revoke roles.
     */
    constructor(uint256 minDelay, address[] memory proposers, address[] memory executors, address admin)
        TimelockController(minDelay, proposers, executors, admin)
    { }
}
