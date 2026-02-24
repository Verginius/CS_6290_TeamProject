// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Counter
 * @dev Minimal scaffold contract included with the default Foundry project
 *      template.  Retained as a sanity-check compile target and to verify
 *      that the base Forge toolchain is working correctly.
 *
 * ============================================================
 * PURPOSE IN THIS PROJECT
 * ============================================================
 *
 * This contract is NOT part of the governance system.  It exists
 * purely as a build and test baseline:
 *
 *   • Counter.t.sol verifies that plain unit tests and fuzz tests
 *     execute correctly under the project's Forge configuration.
 *   • Counter.s.sol (DeployGovernance) happens to share the same
 *     file name convention but deploys the real governance stack.
 *
 * ============================================================
 */
contract Counter {
    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Current counter value.
    uint256 public number;

    // ─────────────────────────────────────────────────────────────────────────
    // Mutators
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Sets the counter to `newNumber`.
    /// @param newNumber New value to store.
    function setNumber(uint256 newNumber) public {
        number = newNumber;
    }

    /// @notice Increments the counter by 1.
    function increment() public {
        number++;
    }
}
