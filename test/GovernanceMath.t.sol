// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GovernanceMathHarness} from "./harness/GovernanceMathHarness.sol";

contract GovernanceMathTest is Test {
    GovernanceMathHarness internal harness;

    function setUp() public {
        harness = new GovernanceMathHarness();
    }

    function testBasisPointHelpers() public view {
        assertEq(harness.applyBps(1_000, 250), 25);
        assertEq(harness.toBps(25, 1_000), 250);
        assertEq(harness.toBps(5, 0), 0);
        assertEq(harness.clamp(5, 10, 20), 10);
        assertEq(harness.clamp(25, 10, 20), 20);
        assertEq(harness.clamp(15, 10, 20), 15);
        assertEq(harness.staticQuorum(1_000_000, 400), 40_000);
    }

    function testApplyBpsAndClampRevertOnInvalidInputs() public {
        vm.expectRevert("GovernanceMath: bps > 100%");
        harness.applyBps(100, 10_001);

        vm.expectRevert("GovernanceMath: hi < lo");
        harness.clamp(10, 20, 19);
    }

    function testDynamicQuorumCalculations() public view {
        uint256[] memory history = new uint256[](3);
        history[0] = 200;
        history[1] = 600;
        history[2] = 1_000;

        assertEq(harness.dynamicQuorumBps(new uint256[](0), 150, 200, 1_000), 200);
        assertEq(harness.dynamicQuorumBps(history, 400, 200, 1_000), 920);
        assertEq(harness.dynamicQuorum(1_000_000, history, 400, 200, 1_000), 92_000);
    }

    function testDynamicQuorumRespectsFloorAndCeiling() public view {
        uint256[] memory lowHistory = new uint256[](2);
        lowHistory[0] = 0;
        lowHistory[1] = 0;
        assertEq(harness.dynamicQuorumBps(lowHistory, 400, 600, 1_000), 600);

        uint256[] memory highHistory = new uint256[](2);
        highHistory[0] = 10_000;
        highHistory[1] = 10_000;
        assertEq(harness.dynamicQuorumBps(highHistory, 400, 200, 1_000), 1_000);
    }

    function testOutcomeHelpers() public view {
        assertTrue(harness.quorumReached(40, 20, 10, 70));
        assertFalse(harness.quorumReached(40, 20, 9, 70));
        assertTrue(harness.majorityReached(51, 49));
        assertFalse(harness.majorityReached(50, 50));
        assertTrue(harness.supermajorityReached(60, 40, 6_000));
        assertFalse(harness.supermajorityReached(59, 41, 6_000));
        assertTrue(harness.proposalSucceeded(60, 40, 10, 100));
        assertFalse(harness.proposalSucceeded(50, 50, 10, 100));
    }

    function testSupermajorityRejectsInvalidThreshold() public {
        vm.expectRevert("GovernanceMath: thresholdBps > 100%");
        harness.supermajorityReached(1, 1, 10_001);
    }

    function testParticipationAndConcentrationMetrics() public view {
        uint256[] memory balances = new uint256[](2);
        balances[0] = 500;
        balances[1] = 500;

        assertEq(harness.participationBps(40, 30, 30, 1_000), 1_000);
        assertEq(harness.herfindahlHirschman(balances, 1_000), 5_000);
        assertEq(harness.giniCoefficient(balances), 0);
    }

    function testConcentrationMetricsHandleEdgeCases() public view {
        uint256[] memory emptyBalances = new uint256[](0);
        assertEq(harness.herfindahlHirschman(emptyBalances, 1_000), 0);
        assertEq(harness.giniCoefficient(emptyBalances), 0);

        uint256[] memory zeroBalances = new uint256[](2);
        zeroBalances[0] = 0;
        zeroBalances[1] = 0;
        assertEq(harness.giniCoefficient(zeroBalances), 0);

        uint256[] memory unequalBalances = new uint256[](3);
        unequalBalances[0] = 0;
        unequalBalances[1] = 0;
        unequalBalances[2] = 100;
        assertGt(harness.giniCoefficient(unequalBalances), 0);
    }
}
