// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Timelock, TimeBasedDefenseConfig} from "../src/defenses/TimeBasedDefense.sol";

contract TimeBasedDefenseTarget {
    uint256 public storedValue;
    uint256 public receivedValue;

    function store(uint256 newValue) external payable returns (uint256) {
        storedValue = newValue;
        receivedValue += msg.value;
        return newValue;
    }
}

contract RevertingTimeBasedDefenseTarget {
    function alwaysRevert(uint256) external pure {
        revert("target revert");
    }
}

contract TimeBasedDefenseTest is Test {
    Timelock internal timelock;
    TimeBasedDefenseTarget internal target;
    RevertingTimeBasedDefenseTarget internal revertingTarget;

    address internal admin = makeAddr("admin");
    address internal user = makeAddr("user");

    function setUp() public {
        timelock = new Timelock(admin, 2 days, 7 days, 3 days);
        target = new TimeBasedDefenseTarget();
        revertingTarget = new RevertingTimeBasedDefenseTarget();
    }

    function testConstructorStoresConfig() public view {
        assertEq(timelock.admin(), admin);
        assertEq(timelock.votingDelay(), 2 days);
        assertEq(timelock.votingPeriod(), 7 days);
        assertEq(timelock.delay(), 3 days);
    }

    function testConstructorRejectsBadArguments() public {
        vm.expectRevert("Timelock: zero admin");
        new Timelock(address(0), 2 days, 7 days, 3 days);

        vm.expectRevert("Timelock: bad voting delay");
        new Timelock(admin, 12 hours, 7 days, 3 days);

        vm.expectRevert("Timelock: bad voting period");
        new Timelock(admin, 2 days, 1 days, 3 days);

        vm.expectRevert("Timelock: bad delay");
        new Timelock(admin, 2 days, 7 days, 31 days);
    }

    function testVoteWindowHelpers() public view {
        uint256 createdAt = 1_000;

        assertEq(timelock.getVoteStartTime(createdAt), createdAt + 2 days);
        assertEq(timelock.getVoteEndTime(createdAt), createdAt + 2 days + 7 days);
        assertEq(timelock.getMinimumTimeToExecution(), 12 days);
    }

    function testQueueExecuteAndCancelFlow() public {
        bytes memory data = abi.encode(42);
        uint256 eta = block.timestamp + timelock.delay() + 1;

        vm.prank(admin);
        bytes32 txHash = timelock.queueTransaction(address(target), 0, "store(uint256)", data, eta);
        assertTrue(timelock.queuedTransactions(txHash));
        assertEq(
            timelock.getTransactionHash(address(target), 0, "store(uint256)", data, eta),
            txHash
        );

        vm.warp(eta);
        vm.prank(admin);
        bytes memory returnData = timelock.executeTransaction(address(target), 0, "store(uint256)", data, eta);

        assertEq(abi.decode(returnData, (uint256)), 42);
        assertEq(target.storedValue(), 42);
        assertFalse(timelock.queuedTransactions(txHash));
    }

    function testExecuteSupportsEmptySignature() public {
        bytes memory data = abi.encodeWithSelector(TimeBasedDefenseTarget.store.selector, 7);
        uint256 eta = block.timestamp + timelock.delay() + 1;

        vm.prank(admin);
        timelock.queueTransaction(address(target), 1 ether, "", data, eta);

        vm.deal(address(timelock), 1 ether);
        vm.warp(eta);

        vm.prank(admin);
        timelock.executeTransaction(address(target), 1 ether, "", data, eta);

        assertEq(target.storedValue(), 7);
        assertEq(target.receivedValue(), 1 ether);
    }

    function testQueueRequiresAdmin() public {
        bytes memory data = abi.encode(1);

        vm.startPrank(user);
        vm.expectRevert("Timelock: only admin");
        timelock.queueTransaction(address(target), 0, "store(uint256)", data, block.timestamp + 4 days);
        vm.stopPrank();
    }

    function testQueueUsesEtaInput() public {
        bytes memory data = abi.encode(1);
        uint256 eta = block.timestamp + timelock.delay() + 2 days;

        vm.prank(admin);
        bytes32 txHash = timelock.queueTransaction(address(target), 0, "store(uint256)", data, eta);

        assertTrue(timelock.queuedTransactions(txHash));
    }

    function testExecuteRevertsWhenNotQueuedReadyOrValid() public {
        bytes memory data = abi.encode(5);
        uint256 eta = block.timestamp + timelock.delay() + 1;

        vm.prank(admin);
        vm.expectRevert("Timelock: transaction not queued");
        timelock.executeTransaction(address(target), 0, "store(uint256)", data, eta);

        vm.prank(admin);
        timelock.queueTransaction(address(target), 0, "store(uint256)", data, eta);

        vm.prank(admin);
        vm.expectRevert("Timelock: transaction not ready");
        timelock.executeTransaction(address(target), 0, "store(uint256)", data, eta);

        vm.warp(eta + timelock.GRACE_PERIOD() + 1);
        vm.prank(admin);
        vm.expectRevert("Timelock: transaction expired");
        timelock.executeTransaction(address(target), 0, "store(uint256)", data, eta);
    }

    function testExecuteRevertsIfUnderlyingCallFails() public {
        bytes memory data = abi.encode(5);
        uint256 eta = block.timestamp + timelock.delay() + 1;

        vm.prank(admin);
        timelock.queueTransaction(address(revertingTarget), 0, "alwaysRevert(uint256)", data, eta);

        vm.warp(eta);
        vm.expectRevert("Timelock: transaction execution reverted");
        vm.prank(admin);
        timelock.executeTransaction(address(revertingTarget), 0, "alwaysRevert(uint256)", data, eta);
    }

    function testCancelClearsQueuedTransaction() public {
        bytes memory data = abi.encode(11);
        uint256 eta = block.timestamp + timelock.delay() + 1;

        vm.prank(admin);
        bytes32 txHash = timelock.queueTransaction(address(target), 0, "store(uint256)", data, eta);

        vm.prank(admin);
        timelock.cancelTransaction(address(target), 0, "store(uint256)", data, eta);

        assertFalse(timelock.queuedTransactions(txHash));
    }

    function testCancelRequiresQueuedTransaction() public {
        vm.prank(admin);
        vm.expectRevert("Timelock: transaction not queued");
        timelock.cancelTransaction(address(target), 0, "store(uint256)", abi.encode(1), block.timestamp + 5 days);
    }

    function testGetPhaseAcrossLifecycle() public {
        uint256 createdAt = block.timestamp + 1 days;

        assertEq(uint256(timelock.getPhase(createdAt, 0, false)), uint256(Timelock.Phase.VotingDelay));

        uint256 voteStart = createdAt + timelock.votingDelay();
        uint256 voteEnd = voteStart + timelock.votingPeriod();

        vm.warp(voteStart + 1);
        assertEq(uint256(timelock.getPhase(createdAt, 0, false)), uint256(Timelock.Phase.VotingPeriod));

        vm.warp(voteEnd + 1);
        assertEq(uint256(timelock.getPhase(createdAt, 0, false)), uint256(Timelock.Phase.Passed));

        uint256 eta = block.timestamp + timelock.delay() + 1;
        assertEq(uint256(timelock.getPhase(createdAt, eta, false)), uint256(Timelock.Phase.Queued));

        vm.warp(eta);
        assertEq(uint256(timelock.getPhase(createdAt, eta, false)), uint256(Timelock.Phase.Executable));

        vm.warp(eta + timelock.GRACE_PERIOD() + 1);
        assertEq(uint256(timelock.getPhase(createdAt, eta, false)), uint256(Timelock.Phase.Expired));
        assertEq(uint256(timelock.getPhase(createdAt, eta, true)), uint256(Timelock.Phase.Expired));
    }

    function testConfigLibrariesReturnExpectedPresets() public pure {
        TimeBasedDefenseConfig.Config memory standard = TimeBasedDefenseConfig.standard();
        TimeBasedDefenseConfig.TimelockOnlyConfig memory small = TimeBasedDefenseConfig.smallTimelock();
        TimeBasedDefenseConfig.TimelockOnlyConfig memory large = TimeBasedDefenseConfig.largeTimelock();

        assertEq(standard.votingDelay, 2 days);
        assertEq(standard.votingPeriod, 7 days);
        assertEq(standard.timelockDelay, 48 hours);

        assertEq(small.normalDelay, 48 hours);
        assertEq(large.criticalDelay, 168 hours);
    }
}
