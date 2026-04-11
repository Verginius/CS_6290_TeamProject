// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {StdCheats} from "forge-std/StdCheats.sol";
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
contract SimulateAttacks is Script, StdCheats {
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
    uint256 private constant FLASH_LOAN_AMOUNT = 250_000_000e18;
    uint256 private constant HALF_TREASURY = 5_000_000e18;
    uint256 private constant WHALE_ATTACK_DRAIN = 1_000_000e18;
    uint256 private constant WHALE_TOKENS_TARGET = 600_000_000e18;
    string private constant RAW_OUTPUT_FILE = "./analysis/data/raw/attack_simulation_raw.json";

    // Main Simulation Function
    function run() external {
        console.log("[GOVERNANCE ATTACK SIMULATIONS]");
        console.log("Starting attack simulations...");

        // Note: Intentionally NOT calling vm.startBroadcast() here.
        // Defended/failed attacks will revert. If we start a broadcast, Foundry will
        // record the reverting transactions and fail the script at the end.
        // Running these purely in the script context avoids the issue.

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

        // Print results
        _printResults();
        _writeRawResults();
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

        // Fund the attack contract with fee amount so it can repay the flash loan
        uint256 fee = attack.getAttackCost(FLASH_LOAN_AMOUNT);
        deal(govToken, address(attack), fee);

        console.log("Executing attack...");

        bool success = false;
        uint256 stolenAmount = 0;
        bool attackSucceeded = false;
        try attack.executeAttack(FLASH_LOAN_AMOUNT, HALF_TREASURY) returns (bool res) {
            success = res;
            stolenAmount = attack.getStolenAmount();
            attackSucceeded = attack.wasAttackSuccessful();
        } catch {
            console.log("Attack blocked by defenses (reverted)");
        }

        console.log("Attack execution result: ", success);
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
        GovernorVulnerable gov = GovernorVulnerable(payable(governor));
        address whale = msg.sender;

        GovernanceToken token = GovernanceToken(govToken);
        deal(govToken, whale, 500_000_000e18);
        console.log("Selected whale attacker:", whale);

        vm.startPrank(whale);
        WhaleManipulation attack = new WhaleManipulation(govToken, governor, mockTreasury);

        // Ensure delegates are set to themselves
        token.selfDelegate();
        vm.roll(block.number + 1);
        console.log("Created whale with voting power: ", token.getVotes(whale));

        uint256 proposalId = 0;
        try attack.createWhaleProposal(whale, WHALE_ATTACK_DRAIN) returns (uint256 id) {
            proposalId = id;
        } catch {
            console.log("Whale proposal blocked by governor rules");
        }

        console.log("Created whale proposal ID: ", proposalId);

        if (proposalId != 0) {
            (uint256 voteStart, uint256 voteEnd) = gov.proposalSnapshot(proposalId);

            // Move to Active State by rolling exactly to voteStart (not past voteEnd).
            if (block.number < voteStart) {
                vm.roll(voteStart);
            }

            // Whale votes directly on governor so voting weight is attributed correctly.
            try gov.castVote(proposalId, 1) returns (uint256 weight) {
                console.log("Whale vote weight: ", weight);
            } catch {
                console.log("Whale vote blocked by governor rules");
            }

            // Move beyond voting period so proposal can be evaluated/executed.
            vm.roll(voteEnd + 1);
            vm.warp(block.timestamp + 10 days); // Also warp time to satisfy any timelocks if present

            console.log("Proposal state before execution: ", uint256(gov.state(proposalId)));
        }

        bool success = false;
        try attack.executeAfterWhaleVote(proposalId) returns (bool res) {
            success = res;
        } catch {
            console.log("Whale vote blocked by governor rules");
        }
        vm.stopPrank();

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
        uint256 spamCount = 0;
        try attack.executeSpamAttack(50) returns (uint256 count) {
            spamCount = count;
        } catch {
            console.log("Attack blocked by defenses (reverted)");
        }
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

        uint256 proposalId = 0;
        bool succeeded = false;
        uint256 bypassed = 0;
        try attack.executeTimingAttack(WHALE_ATTACK_DRAIN, 500) returns (uint256 id) {
            proposalId = id;
            succeeded = attack.wasAttackSuccessful();
            bypassed = attack.getBypassAmount();
        } catch {
            console.log("Attack blocked by defenses (reverted)");
        }

        console.log("Proposal ID created: ", proposalId);
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
        address timelock =
            vm.envExists("TIMELOCK_ADDRESS") ? vm.envAddress("TIMELOCK_ADDRESS") : vm.envAddress("TIMELOCK");

        if (timelock == address(0)) {
            console.log("No timelock configured, skipping attack.");
            results.push(
                AttackResult({
                    attackName: "Timelock Exploit",
                    succeeded: false,
                    amountExtracted: 0,
                    details: "Skipped - no timelock"
                })
            );
            return;
        }

        TimelockExploit attack = new TimelockExploit(governor, timelock, mockTreasury);
        console.log("Identifying timelock vulnerabilities...");
        uint256 delay = attack.identifyTimelockVulnerabilities();
        console.log("Timelock delay identified: ", delay, " seconds");

        bool success = false;
        bool succeeded = false;
        uint256 stolen = 0;
        try attack.executeEmergencyFunctionBypass("emergencyWithdraw()", 100_000e18) returns (bool res) {
            success = res;
            succeeded = attack.wasAttackSuccessful();
            stolen = attack.getAmountStolen();
        } catch {
            console.log("Attack blocked by defenses (reverted)");
        }

        console.log("Emergency function bypass result: ", success);
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

    function _writeRawResults() internal {
        string memory json = _buildRawJson();
        // forge-lint: disable-next-line(unsafe-cheatcode)
        vm.writeFile(RAW_OUTPUT_FILE, json);
        console.log("Raw simulation JSON written to:", RAW_OUTPUT_FILE);
    }

    function _buildRawJson() internal view returns (string memory json) {
        uint256 successCount = 0;
        uint256 totalExtracted = 0;

        for (uint256 i = 0; i < results.length; i++) {
            if (results[i].succeeded) {
                successCount++;
            }
            totalExtracted += results[i].amountExtracted;
        }

        uint256 successRate = results.length == 0 ? 0 : (successCount * 100) / results.length;

        json = string(
            abi.encodePacked(
                "{\n",
                '  "metadata": {\n',
                '    "timestamp": "',
                _uint2str(block.timestamp),
                '",\n',
                '    "chainId": ',
                _uint2str(block.chainid),
                ",\n",
                '    "totalAttacks": ',
                _uint2str(results.length),
                "\n",
                "  },\n",
                '  "attacks": [\n'
            )
        );

        for (uint256 i = 0; i < results.length; i++) {
            json = string(abi.encodePacked(json, _buildAttackJson(results[i], i == results.length - 1)));
        }

        json = string(
            abi.encodePacked(
                json,
                "  ],\n",
                '  "summary": {\n',
                '    "totalSuccessful": ',
                _uint2str(successCount),
                ",\n",
                '    "successRate": ',
                _uint2str(successRate),
                ",\n",
                '    "totalExtracted": "',
                _uint2str(totalExtracted),
                '"\n',
                "  }\n",
                "}\n"
            )
        );
    }

    function _buildAttackJson(AttackResult memory attack, bool isLast) internal pure returns (string memory) {
        string memory entry = string(
            abi.encodePacked(
                "    {\n",
                '      "name": "',
                attack.attackName,
                '",\n',
                '      "succeeded": ',
                attack.succeeded ? "true" : "false",
                ",\n",
                '      "amountExtracted": "',
                _uint2str(attack.amountExtracted),
                '",\n',
                '      "details": "',
                attack.details,
                '"\n',
                "    }"
            )
        );

        return isLast ? string(abi.encodePacked(entry, "\n")) : string(abi.encodePacked(entry, ",\n"));
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

