// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {StructuralControlDefense} from "../src/defenses/StructuralControlDefense.sol";

contract StructuralControlDefenseTest is Test {
    StructuralControlDefense internal defense;

    address internal owner = makeAddr("owner");
    address internal signer1 = makeAddr("signer1");
    address internal signer2 = makeAddr("signer2");
    address internal signer3 = makeAddr("signer3");
    address internal guardian1 = makeAddr("guardian1");
    address internal guardian2 = makeAddr("guardian2");
    address internal outsider = makeAddr("outsider");

    function setUp() public {
        vm.prank(owner);
        defense = new StructuralControlDefense(_signers(), 2, makeAddr("governance"), _guardianConfig());
    }

    function testConstructorInitializesRolesAndPhase() public view {
        assertEq(defense.requiredSigs(), 2);
        assertEq(defense.requiredPauseConfirmations(), 2);
        assertEq(uint256(defense.currentPhase()), uint256(StructuralControlDefense.ProgressiveDecentralizationPhase.PHASE_1));
        assertEq(defense.getSigners().length, 3);
        assertEq(defense.getGuardians().length, 2);
        assertEq(defense.getPauseAdmins().length, 3);
    }

    function testConstructorRejectsInvalidSignerConfig() public {
        vm.prank(owner);
        vm.expectRevert("Invalid signer count");
        new StructuralControlDefense(_signers(), 4, makeAddr("governance"), _guardianConfig());

        vm.prank(owner);
        vm.expectRevert("Required sigs must be > 0");
        new StructuralControlDefense(_signers(), 0, makeAddr("governance"), _guardianConfig());
    }

    function testProposeConfirmExecuteFlow() public {
        string memory txId = _proposeTransaction();

        vm.prank(signer1);
        defense.confirmTransaction(txId);
        assertFalse(defense.canExecute(txId));

        vm.prank(signer2);
        defense.confirmTransaction(txId);
        assertFalse(defense.canExecute(txId));

        vm.warp(block.timestamp + defense.minDelay());
        assertTrue(defense.canExecute(txId));

        defense.executeTransaction(txId);
        assertFalse(defense.canExecute(txId));
    }

    function testProposeUsesDefaultEtaAndTracksHistory() public {
        uint256 beforeTs = block.timestamp;
        string memory txId = _proposeTransaction();

        assertGt(bytes(txId).length, 0);
        assertEq(defense.transactionHistory(0), txId);
        assertFalse(defense.canExecute(txId));

        vm.warp(beforeTs + defense.minDelay() - 1);
        assertFalse(defense.canExecute(txId));
    }

    function testProposeBlockedWhenPaused() public {
        _pauseGovernance();

        vm.expectRevert("Governance is paused");
        defense.proposeTransaction(address(this), 1 ether, "transfer()", "", 0);
    }

    function testConfirmTransactionRequiresSignerAndValidState() public {
        string memory txId = _proposeTransaction();

        vm.prank(outsider);
        vm.expectRevert("Not a signer");
        defense.confirmTransaction(txId);

        vm.prank(signer1);
        defense.confirmTransaction(txId);

        vm.prank(signer1);
        vm.expectRevert("Already confirmed");
        defense.confirmTransaction(txId);

        vm.prank(signer2);
        defense.confirmTransaction(txId);
        vm.warp(block.timestamp + defense.minDelay());
        defense.executeTransaction(txId);

        vm.prank(signer3);
        vm.expectRevert("Invalid status");
        defense.confirmTransaction(txId);
    }

    function testCancelTransactionRequiresSignerAndBlocksExecution() public {
        string memory txId = _proposeTransaction();

        vm.prank(outsider);
        vm.expectRevert("Not a signer");
        defense.cancelTransaction(txId, "bad actor");

        vm.prank(signer1);
        defense.cancelTransaction(txId, "bad actor");
        assertFalse(defense.canExecute(txId));
    }

    function testVetoTransactionRequiresActiveGuardian() public {
        string memory txId = _proposeTransaction();

        vm.prank(outsider);
        vm.expectRevert("Not a guardian");
        defense.vetoTransaction(txId, "no access");

        vm.prank(guardian1);
        defense.vetoTransaction(txId, "guardian veto");
        assertFalse(defense.canExecute(txId));
    }

    function testVetoTransactionRespectsGuardianFlagsAndExpiry() public {
        vm.prank(owner);
        StructuralControlDefense limitedDefense =
            new StructuralControlDefense(_signers(), 2, makeAddr("gov2"), _guardianConfigNoVeto());

        string memory txId = _proposeTransaction(limitedDefense);
        vm.prank(guardian1);
        vm.expectRevert("Cannot veto");
        limitedDefense.vetoTransaction(txId, "disabled");

        vm.prank(owner);
        StructuralControlDefense expiringDefense =
            new StructuralControlDefense(_signers(), 2, makeAddr("gov3"), _guardianConfigExpiring());

        string memory expiringTxId = _proposeTransaction(expiringDefense);
        vm.warp(block.timestamp + 3 days);
        vm.prank(guardian1);
        vm.expectRevert("Guardian expired");
        expiringDefense.vetoTransaction(expiringTxId, "too late");
    }

    function testGuardianAdministrativeActionsAndRenounce() public {
        vm.prank(guardian1);
        defense.cancelProposal("proposal-1", "guardian cancel");

        vm.prank(guardian2);
        defense.vetoExecution("proposal-1", "guardian veto");

        vm.prank(guardian1);
        defense.renounceGuardianRole();
        assertEq(defense.getGuardians().length, 1);

        vm.prank(guardian2);
        defense.renounceGuardianRole();
        assertEq(defense.getGuardians().length, 0);
        (bool canCancel, bool canVeto, bool canPause) = _guardianFlags(defense);
        assertFalse(canCancel);
        assertFalse(canVeto);
        assertFalse(canPause);
    }

    function testPauseAndUnpauseRequireThreshold() public {
        vm.prank(signer1);
        defense.confirmPause("incident");
        assertFalse(defense.isPaused());

        vm.prank(signer1);
        vm.expectRevert("Already confirmed");
        defense.confirmPause("incident");

        vm.prank(signer2);
        defense.confirmPause("incident");
        assertTrue(defense.isPaused());
        assertEq(defense.pauseReason(), "incident");

        (string memory reason, address[] memory confirmers, uint256 timestamp) = defense.getPauseRecord(0);
        assertEq(reason, "incident");
        assertEq(confirmers.length, 2);
        assertGt(timestamp, 0);

        vm.warp(block.timestamp + 1 hours);
        vm.prank(signer1);
        defense.unpause();
        assertFalse(defense.isPaused());
    }

    function testPauseFunctionsRequirePauseAdminAndState() public {
        vm.prank(outsider);
        vm.expectRevert("Not a pause admin");
        defense.confirmPause("incident");

        vm.prank(signer1);
        vm.expectRevert("Not paused");
        defense.unpause();
    }

    function testAdvancePhaseAppliesProgressiveRestrictions() public {
        vm.prank(owner);
        defense.advancePhase(StructuralControlDefense.ProgressiveDecentralizationPhase.PHASE_2);
        (bool canCancel,,) = _guardianFlags(defense);
        assertFalse(canCancel);

        vm.prank(owner);
        defense.advancePhase(StructuralControlDefense.ProgressiveDecentralizationPhase.PHASE_3);
        assertEq(defense.requiredPauseConfirmations(), 3);

        vm.prank(owner);
        defense.advancePhase(StructuralControlDefense.ProgressiveDecentralizationPhase.PHASE_4);
        assertEq(defense.getGuardians().length, 0);
        (, bool canVeto,) = _guardianFlags(defense);
        assertFalse(canVeto);
    }

    function testIsGuardianActiveReflectsExpiry() public {
        assertTrue(defense.isGuardianActive());

        vm.prank(owner);
        StructuralControlDefense expiringDefense =
            new StructuralControlDefense(_signers(), 2, makeAddr("gov4"), _guardianConfigExpiring());
        assertTrue(expiringDefense.isGuardianActive());

        vm.warp(block.timestamp + 3 days);
        assertFalse(expiringDefense.isGuardianActive());
    }

    function testGetTransactionConfirmationsReturnsConfirmers() public {
        string memory txId = _proposeTransaction();

        vm.prank(signer1);
        defense.confirmTransaction(txId);
        vm.prank(signer2);
        defense.confirmTransaction(txId);

        address[] memory confirmations = defense.getTransactionConfirmations(txId);
        assertEq(confirmations.length, 2);
    }

    function _pauseGovernance() internal {
        vm.prank(signer1);
        defense.confirmPause("incident");
        vm.prank(signer2);
        defense.confirmPause("incident");
    }

    function _proposeTransaction() internal returns (string memory) {
        return _proposeTransaction(defense);
    }

    function _proposeTransaction(StructuralControlDefense targetDefense) internal returns (string memory) {
        return targetDefense.proposeTransaction(address(this), 1 ether, "transfer()", "", 0);
    }

    function _signers() internal view returns (address[] memory signerList) {
        signerList = new address[](3);
        signerList[0] = signer1;
        signerList[1] = signer2;
        signerList[2] = signer3;
    }

    function _guardianConfig() internal view returns (StructuralControlDefense.GuardianConfig memory config) {
        address[] memory guardians = new address[](2);
        guardians[0] = guardian1;
        guardians[1] = guardian2;

        config = StructuralControlDefense.GuardianConfig({
            addresses: guardians,
            requiredSignatures: 1,
            canCancel: true,
            canVeto: true,
            canPause: true,
            timeboundExpiration: 0
        });
    }

    function _guardianConfigNoVeto() internal view returns (StructuralControlDefense.GuardianConfig memory config) {
        config = _guardianConfig();
        config.canVeto = false;
    }

    function _guardianConfigExpiring() internal view returns (StructuralControlDefense.GuardianConfig memory config) {
        config = _guardianConfig();
        config.timeboundExpiration = block.timestamp + 2 days;
    }

    function _guardianFlags(StructuralControlDefense targetDefense)
        internal
        view
        returns (bool canCancel, bool canVeto, bool canPause)
    {
        (, canCancel, canVeto, canPause,) = targetDefense.guardianConfig();
    }
}
