// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

// Attack Contracts
import {FlashLoanAttack} from "../src/attacks/FlashLoanAttack.sol";
import {WhaleManipulation} from "../src/attacks/WhaleManipulation.sol";
import {ProposalSpam} from "../src/attacks/ProposalSpam.sol";
import {QuorumManipulation} from "../src/attacks/QuorumManipulation.sol";
import {TimelockExploit} from "../src/attacks/TimelockExploit.sol";

// Token and Contracts
import {GovernanceToken} from "../src/governance/GovernanceToken.sol";
import {GovernorVulnerable} from "../src/governance/GovernorVulnerable.sol";

/**
 * @title SimulateAttacks
 * @dev Foundry script to run all 5 attack simulations
 */
contract SimulateAttacks is Script {
    // State
    struct AttackResult {
        string attackName;
        bool succeeded;
        uint256 amountExtracted;
        string details;
    }

    AttackResult[] public results;

    // Configuration
    address public constant DEPLOYER = address(0x1);
    uint256 private constant FLASH_LOAN_AMOUNT = 500_000_000e18;
    uint256 private constant HALF_TREASURY = 5_000_000e18;
    uint256 private constant WHALE_ATTACK_DRAIN = 1_000_000e18;

    // Main Simulation Function
    function run() external {
        console.log("[GOVERNANCE ATTACK SIMULATIONS]");
        console.log("Starting attack simulations...");

        vm.startBroadcast();

        // Get contract addresses
        address govToken = vm.envAddress("GOV_TOKEN_ADDRESS");
        address governor = vm.envAddress("GOVERNOR_VULNERABLE_ADDRESS");
        address mockTreasury = vm.envAddress("MOCK_TREASURY_ADDRESS");
        address flashLoanProvider = vm.envAddress("FLASH_LOAN_PROVIDER_ADDRESS");

        console.log("Using contract addresses:");
        console.log("  Gov Token: ", govToken);
        console.log("  Governor: ", governor);
        console.log("  Mock Treasury: ", mockTreasury);
        console.log("  Flash Loan Provider: ", flashLoanProvider);

        // Simulate each attack
        _simulateFlashLoanAttack(govToken, governor, mockTreasury, flashLoanProvider);
        _simulateWhaleManipulation(govToken, governor, mockTreasury);
        _simulateProposalSpam(governor);
        _simulateQuorumManipulation(govToken, governor, mockTreasury);
        _simulateTimelockExploit(governor, mockTreasury);

        vm.stopBroadcast();

        // Print results
        _printResults();
    }

    // Attack Simulation Functions
    function _simulateFlashLoanAttack(
        address govToken,
        address governor,
        address mockTreasury,
        address flashLoanProvider
    ) internal {
        console.log("[1] Flash Loan Attack");
        _executeFlashLoanAttack(govToken, governor, mockTreasury, flashLoanProvider);
    }

    function _executeFlashLoanAttack(
        address govToken,
        address governor,
        address mockTreasury,
        address flashLoanProvider
    ) internal {
        FlashLoanAttack attack = new FlashLoanAttack(flashLoanProvider, govToken, governor, mockTreasury);
        console.log("Executing attack...");
        bool success = attack.executeAttack(FLASH_LOAN_AMOUNT, HALF_TREASURY);
        console.log("Attack execution result: ", success);
        uint256 stolenAmount = attack.getStolenAmount();
        bool attackSucceeded = attack.wasAttackSuccessful();
        console.log("Stolen amount: ", stolenAmount);
        console.log("Attack succeeded: ", attackSucceeded);
        results.push(
            AttackResult({
                attackName: "Flash Loan Attack",
                succeeded: attackSucceeded,
                amountExtracted: stolenAmount,
                details: "Borrowed tokens, voted, executed proposal"
            })
        );
        console.log("PASS: Flash Loan Attack completed");
    }

    function _simulateWhaleManipulation(address govToken, address governor, address mockTreasury) internal {
        console.log("[2] Whale Manipulation");
        WhaleManipulation attack = new WhaleManipulation(govToken, governor, mockTreasury);
        GovernorVulnerable gov = GovernorVulnerable(payable(governor));
        address whale = address(0xDEADBEEF);

        GovernanceToken(govToken).transfer(whale, 600_000_000e18);
        vm.prank(whale);
        GovernanceToken(govToken).delegate(whale);

        console.log("Created whale with 60% voting power");

        uint256 proposalId = attack.createWhaleProposal(whale, WHALE_ATTACK_DRAIN);
        console.log("Created whale proposal ID: ", proposalId);

        // Move from Pending to Active.
        vm.roll(block.number + gov.votingDelay() + 1);

        // Whale votes directly on governor so voting weight is attributed correctly.
        vm.prank(whale);
        console.log("Whale vote weight: ", gov.castVote(proposalId, 1));

        // Move beyond voting period so proposal can be evaluated/executed.
        vm.roll(block.number + gov.votingPeriod() + 1);

        bool success = attack.executeAfterWhaleVote(proposalId);
        console.log("Attack execution result: ", success);
        uint256 stolenAmount = attack.getAmountStolen();
        bool succeeded = attack.wasAttackSuccessful();
        console.log("Stolen amount: ", stolenAmount);
        console.log("Attack succeeded: ", succeeded);
        results.push(
            AttackResult({
                attackName: "Whale Manipulation",
                succeeded: succeeded,
                amountExtracted: stolenAmount,
                details: "Whale directly voted then executed self-serving proposal"
            })
        );
        console.log("PASS: Whale Manipulation completed");
    }

    function _simulateProposalSpam(address governor) internal {
        console.log("[3] Proposal Spam");
        ProposalSpam attack = new ProposalSpam(governor);
        console.log("Creating spam proposals (50)...");
        uint256 spamCount = attack.executeSpamAttack(50);
        console.log("Spam proposals created: ", spamCount);
        (uint256 total, uint256 percent, uint256 fatigue, uint256 difficulty) = attack.analyzeAttackEffectiveness();
        console.log("Total proposals: ", total);
        console.log("Percent malicious: ", percent);
        console.log("Estimated voter fatigue (bps): ", fatigue);
        console.log("Detection difficulty: ", difficulty);
        results.push(
            AttackResult({
                attackName: "Proposal Spam",
                succeeded: spamCount > 0,
                amountExtracted: spamCount,
                details: string(abi.encodePacked("Created ", _uint2str(spamCount), " spam proposals"))
            })
        );
        console.log("PASS: Proposal Spam completed");
    }

    function _simulateQuorumManipulation(address govToken, address governor, address mockTreasury) internal {
        console.log("[4] Quorum Manipulation");
        QuorumManipulation attack = new QuorumManipulation(govToken, governor, mockTreasury);
        console.log("Simulating low-participation window attack...");
        uint256 proposalId = attack.executeTimingAttack(WHALE_ATTACK_DRAIN, 500);
        console.log("Proposal ID created: ", proposalId);
        bool succeeded = attack.wasAttackSuccessful();
        uint256 bypassed = attack.getBypassAmount();
        console.log("Attack succeeded: ", succeeded);
        console.log("Amount bypassed quorum: ", bypassed);
        results.push(
            AttackResult({
                attackName: "Quorum Manipulation",
                succeeded: succeeded,
                amountExtracted: bypassed,
                details: "Timed attack during low-participation window (5%)"
            })
        );
        console.log("PASS: Quorum Manipulation completed");
    }

    function _simulateTimelockExploit(address governor, address mockTreasury) internal {
        console.log("[5] Timelock Exploit");
        address timelock = vm.envAddress("TIMELOCK");
        TimelockExploit attack = new TimelockExploit(governor, timelock, mockTreasury);
        console.log("Identifying timelock vulnerabilities...");
        uint256 delay = attack.identifyTimelockVulnerabilities();
        console.log("Timelock delay identified: ", delay, " seconds");
        bool success = attack.executeEmergencyFunctionBypass("emergencyWithdraw", 100_000e18);
        console.log("Emergency function bypass result: ", success);
        bool succeeded = attack.wasAttackSuccessful();
        uint256 stolen = attack.getAmountStolen();
        console.log("Attack succeeded: ", succeeded);
        console.log("Amount stolen: ", stolen);
        results.push(
            AttackResult({
                attackName: "Timelock Exploit",
                succeeded: succeeded,
                amountExtracted: stolen,
                details: "Attempted emergency function bypass"
            })
        );
        console.log("PASS: Timelock Exploit completed");
    }

    // Result Reporting
    function _printResults() internal view {
        console.log("[ATTACK SIMULATION RESULTS]");

        for (uint256 i = 0; i < results.length; i++) {
            console.log(string(abi.encodePacked("Attack ", _uint2str(i + 1), ": ", results[i].attackName)));
            console.log("  Status: ", results[i].succeeded ? "SUCCESS" : "FAILED");
            console.log("  Amount Extracted: ", results[i].amountExtracted);
            console.log("  Details: ", results[i].details);
        }

        uint256 successCount = 0;
        for (uint256 i = 0; i < results.length; i++) {
            if (results[i].succeeded) {
                successCount++;
            }
        }

        console.log("Overall Success Rate: ", (successCount * 100) / results.length, "%");
    }

    // Utilities
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        bytes memory digits = "0123456789";
        uint256 k = len;
        while (_i != 0) {
            k--;
            bstr[k] = digits[_i % 10];
            _i /= 10;
        }
        return string(bstr);
    }

    function getResults() public view returns (AttackResult[] memory) {
        return results;
    }
}
