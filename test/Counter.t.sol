// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";

/**
 * @title CounterTest
 * @dev Unit and fuzz tests for the Counter scaffold contract.
 *
 * ============================================================
 * TEST COVERAGE
 * ============================================================
 *
 * test_Increment          — verifies that increment() adds exactly 1.
 * testFuzz_SetNumber(x)   — property test: setNumber(x) always stores x
 *                            exactly, for any uint256 input (Forge fuzz).
 *
 * ============================================================
 * NOTE
 * ============================================================
 *
 * These tests are framework baseline checks only and are not related
 * to the governance security research.  They exercise basic Foundry
 * test patterns (concrete unit test + fuzz test) under the project's
 * actual compiler and remapping configuration.
 *
 * ============================================================
 */
contract CounterTest is Test {
    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    Counter public counter;

    // ─────────────────────────────────────────────────────────────────────────
    // Setup
    // ─────────────────────────────────────────────────────────────────────────

    function setUp() public {
        counter = new Counter();
        counter.setNumber(0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tests
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice increment() increases the counter by exactly 1.
    function test_Increment() public {
        counter.increment();
        assertEq(counter.number(), 1);
    }

    /// @notice setNumber stores arbitrary values correctly (fuzz).
    function testFuzz_SetNumber(uint256 x) public {
        counter.setNumber(x);
        assertEq(counter.number(), x);
    }
}
