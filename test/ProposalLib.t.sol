// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ProposalLibHarness, ProposalLibTarget} from "./harness/ProposalLibHarness.sol";

contract ProposalLibTest is Test {
    ProposalLibHarness internal harness;
    ProposalLibTarget internal target;

    function setUp() public {
        harness = new ProposalLibHarness();
        target = new ProposalLibTarget();
    }

    function testHashHelpersAreDeterministic() public view {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas) = _singleCall();
        bytes32 descriptionHash = harness.hashDescription("proposal");

        assertEq(descriptionHash, keccak256(bytes("proposal")));
        assertEq(
            harness.hashProposal(targets, values, calldatas, descriptionHash),
            harness.hashProposal(targets, values, calldatas, descriptionHash)
        );
    }

    function testValidateArrayLengthsSuccessAndFailures() public {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas) = _singleCall();
        harness.validateArrayLengths(targets, values, calldatas);

        address[] memory emptyTargets = new address[](0);
        uint256[] memory emptyValues = new uint256[](0);
        bytes[] memory emptyCalldatas = new bytes[](0);
        vm.expectRevert("ProposalLib: empty proposal");
        harness.validateArrayLengths(emptyTargets, emptyValues, emptyCalldatas);

        uint256[] memory shortValues = new uint256[](0);
        vm.expectRevert("ProposalLib: targets/values length mismatch");
        harness.validateArrayLengths(targets, shortValues, calldatas);

        bytes[] memory shortCalldatas = new bytes[](0);
        vm.expectRevert("ProposalLib: targets/calldatas length mismatch");
        harness.validateArrayLengths(targets, values, shortCalldatas);
    }

    function testValidateCalldataSuccessAndFailures() public {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas) = _singleCall();
        harness.validateCalldata(targets, values, calldatas, targets, values, calldatas);

        address[] memory otherTargets = new address[](1);
        otherTargets[0] = address(0xBEEF);
        vm.expectRevert("ProposalLib: target mismatch");
        harness.validateCalldata(targets, values, calldatas, otherTargets, values, calldatas);

        uint256[] memory otherValues = new uint256[](1);
        otherValues[0] = 1;
        vm.expectRevert("ProposalLib: value mismatch");
        harness.validateCalldata(targets, values, calldatas, targets, otherValues, calldatas);

        bytes[] memory otherCalldatas = new bytes[](1);
        otherCalldatas[0] = abi.encodeWithSelector(ProposalLibTarget.store.selector, 2);
        vm.expectRevert("ProposalLib: calldata mismatch");
        harness.validateCalldata(targets, values, calldatas, targets, values, otherCalldatas);
    }

    function testVotingWindowHelpers() public {
        uint256 voteStart = harness.voteStartBlock(100, 10);
        uint256 voteEnd = harness.voteEndBlock(voteStart, 50);

        assertEq(voteStart, 110);
        assertEq(voteEnd, 160);

        vm.roll(109);
        assertTrue(harness.isPending(voteStart));
        assertFalse(harness.isVotingActive(voteStart, voteEnd));

        vm.roll(120);
        assertTrue(harness.isVotingActive(voteStart, voteEnd));
        assertFalse(harness.isVotingEnded(voteEnd));

        vm.roll(161);
        assertTrue(harness.isVotingEnded(voteEnd));
    }

    function testTimelockHelpers() public {
        uint256 eta = harness.computeEta(block.timestamp, 2 days);
        assertEq(eta, block.timestamp + 2 days);
        assertFalse(harness.isReady(eta));

        vm.warp(eta);
        assertTrue(harness.isReady(eta));
        assertFalse(harness.isExpired(eta, 3 days));

        vm.warp(eta + 3 days);
        assertTrue(harness.isExpired(eta, 3 days));
    }

    function testExecuteBatchSuccess() public {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas) = _singleCall();
        harness.executeBatch(targets, values, calldatas);
        assertEq(target.stored(), 1);
    }

    function testExecuteBatchPropagatesRevertMessage() public {
        address[] memory targets = new address[](1);
        targets[0] = address(target);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(ProposalLibTarget.revertWithMessage.selector);

        vm.expectRevert(bytes("target revert"));
        harness.executeBatch(targets, values, calldatas);
    }

    function testExecuteBatchHandlesBareRevert() public {
        address[] memory targets = new address[](1);
        targets[0] = address(target);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(ProposalLibTarget.revertWithoutMessage.selector);

        vm.expectRevert("ProposalLib: call reverted without message");
        harness.executeBatch(targets, values, calldatas);
    }

    function _singleCall()
        internal
        view
        returns (address[] memory targets, uint256[] memory values, bytes[] memory calldatas)
    {
        targets = new address[](1);
        values = new uint256[](1);
        calldatas = new bytes[](1);
        targets[0] = address(target);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(ProposalLibTarget.store.selector, 1);
    }
}
