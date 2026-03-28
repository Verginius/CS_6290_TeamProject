// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

// Governance Contracts
import {GovernanceToken} from "../src/governance/GovernanceToken.sol";
import {GovernorVulnerable, ITokenVotes as ITokenVotesVulnerable} from "../src/governance/GovernorVulnerable.sol";
import {GovernorWithDefenses, ITokenVotes as ITokenVotesDefenses} from "../src/governance/GovernorWithDefenses.sol";
import {Timelock as GovernanceTimelock} from "../src/governance/Timelock.sol";
import {TimeBasedDefenseConfig} from "../src/defenses/TimeBasedDefense.sol";

// Mock Contracts
import {MockTreasury} from "../src/mocks/MockTreasury.sol";

/**
 * @title SetupScenarios
 * @dev Foundry script to create predefined test scenarios
 */
contract SetupScenarios is Script {
    uint256 private constant TOTAL_SUPPLY = 1_000_000_000e18;
    uint256 private constant VOTING_DELAY = 1;
    uint256 private constant VOTING_PERIOD = 50_400;

    struct ScenarioConfig {
        string name;
        string description;
        uint256 quorumPercentage;
        uint256 proposalThreshold;
        bool hasTimelock;
        uint256 timelockDelay;
        uint256 numAddresses;
        string tokenDistribution;
    }

    struct DeploymentAddresses {
        address govToken;
        address governorVulnerable;
        address governorDefended;
        address timelock;
        address mockTreasury;
    }

    DeploymentAddresses public deployedContracts;
    ScenarioConfig public selectedScenario;

    // Main Function
    function run() external {
        console.log("[SETTING UP GOVERNANCE TEST SCENARIOS]");

        string memory scenarioSelect = vm.envExists("SCENARIO") ? vm.envString("SCENARIO") : "A";
        _selectScenario(scenarioSelect);

        console.log("Selected Scenario: ", selectedScenario.name);
        console.log("Description: ", selectedScenario.description);
        console.log("");

        vm.startBroadcast();

        _deployGovernanceContracts();
        _setupTokenDistribution();
        _setupTreasury();

        vm.stopBroadcast();

        _printScenarioReport();
    }

    // Scenario Selection
    function _selectScenario(string memory scenario) internal {
        if (_stringsEqual(scenario, "A")) {
            selectedScenario = ScenarioConfig({
                name: "Scenario A - Extreme Vulnerability",
                description: "Single whale with 60% voting power, zero quorum, no timelock.",
                quorumPercentage: 0,
                proposalThreshold: 0,
                hasTimelock: false,
                timelockDelay: 0,
                numAddresses: 1,
                tokenDistribution: "whale"
            });
        } else if (_stringsEqual(scenario, "B")) {
            selectedScenario = ScenarioConfig({
                name: "Scenario B - Whale-Heavy Distribution",
                description: "Top 3 whales hold 80% of tokens, 4% quorum, 2-day timelock.",
                quorumPercentage: 4,
                proposalThreshold: 1,
                hasTimelock: true,
                timelockDelay: TimeBasedDefenseConfig.standard().timelockDelay,
                numAddresses: 3,
                tokenDistribution: "top3"
            });
        } else if (_stringsEqual(scenario, "C")) {
            selectedScenario = ScenarioConfig({
                name: "Scenario C - Distributed Holdings",
                description: "Tokens evenly distributed across 100 addresses.",
                quorumPercentage: 10,
                proposalThreshold: 1,
                hasTimelock: true,
                timelockDelay: TimeBasedDefenseConfig.standard().timelockDelay,
                numAddresses: 100,
                tokenDistribution: "distributed"
            });
        } else if (_stringsEqual(scenario, "D")) {
            selectedScenario = ScenarioConfig({
                name: "Scenario D - Fair Governance",
                description: "Gaussian distribution with median holdings.",
                quorumPercentage: 20,
                proposalThreshold: 2,
                hasTimelock: true,
                timelockDelay: TimeBasedDefenseConfig.largeTimelock().criticalDelay,
                numAddresses: 50,
                tokenDistribution: "gaussian"
            });
        } else if (_stringsEqual(scenario, "E")) {
            selectedScenario = ScenarioConfig({
                name: "Scenario E - Paranoid Security",
                description: "Equal distribution across 1000 addresses with max security.",
                quorumPercentage: 50,
                proposalThreshold: 5,
                hasTimelock: true,
                timelockDelay: TimeBasedDefenseConfig.largeTimelock().criticalDelay,
                numAddresses: 1000,
                tokenDistribution: "equal"
            });
        } else {
            revert("Unknown scenario. Use A, B, C, D, or E.");
        }
    }

    // Deployment Functions
    function _deployGovernanceContracts() internal {
        address admin = msg.sender;

        GovernanceToken token = new GovernanceToken("Governance Token", "GOV", admin, TOTAL_SUPPLY);

        deployedContracts.govToken = address(token);
        console.log("PASS: Governance Token deployed at:", address(token));

        if (selectedScenario.hasTimelock) {
            address[] memory proposers = new address[](1);
            proposers[0] = address(0);

            address[] memory executors = new address[](1);
            executors[0] = address(0);

            GovernanceTimelock timelock =
                new GovernanceTimelock(selectedScenario.timelockDelay, proposers, executors, admin);

            deployedContracts.timelock = address(timelock);
            console.log("PASS: Timelock deployed at:", address(timelock));
        } else {
            deployedContracts.timelock = address(0);
        }

        GovernorVulnerable govVuln = new GovernorVulnerable(
            "Governor Vulnerable",
            ITokenVotesVulnerable(address(token)),
            VOTING_DELAY,
            VOTING_PERIOD,
            selectedScenario.proposalThreshold,
            selectedScenario.quorumPercentage
        );

        deployedContracts.governorVulnerable = address(govVuln);
        console.log("PASS: Vulnerable Governor deployed at:", address(govVuln));

        if (selectedScenario.hasTimelock) {
            GovernorWithDefenses govDef = new GovernorWithDefenses(
                "Governor With Defenses",
                ITokenVotesDefenses(address(token)),
                GovernanceTimelock(payable(deployedContracts.timelock)),
                VOTING_DELAY,
                VOTING_PERIOD,
                selectedScenario.proposalThreshold,
                selectedScenario.quorumPercentage
            );

            deployedContracts.governorDefended = address(govDef);
            console.log("PASS: Defended Governor deployed at:", address(govDef));
        } else {
            deployedContracts.governorDefended = address(0);
            console.log("INFO: Defended Governor not deployed (no timelock for this scenario)");
        }
    }

    function _setupTokenDistribution() internal {
        GovernanceToken token = GovernanceToken(deployedContracts.govToken);

        console.log("");
        console.log("Setting up token distribution - ", selectedScenario.tokenDistribution);

        if (_stringsEqual(selectedScenario.tokenDistribution, "whale")) {
            address whale = address(0xDEADBEEF);
            uint256 whaleAmount = (TOTAL_SUPPLY * 60) / 100;
            require(token.transfer(whale, whaleAmount), "transfer whale failed");
            console.log("  Whale receives:", whaleAmount / 1e18, "tokens (60%)");
        } else if (_stringsEqual(selectedScenario.tokenDistribution, "top3")) {
            address[] memory whales = new address[](3);
            whales[0] = address(0x0001);
            whales[1] = address(0x0002);
            whales[2] = address(0x0003);

            uint256 whale1Amount = (TOTAL_SUPPLY * 27) / 100;
            uint256 whale2Amount = (TOTAL_SUPPLY * 27) / 100;
            uint256 whale3Amount = (TOTAL_SUPPLY * 26) / 100;

            require(token.transfer(whales[0], whale1Amount), "transfer whale1 failed");
            require(token.transfer(whales[1], whale2Amount), "transfer whale2 failed");
            require(token.transfer(whales[2], whale3Amount), "transfer whale3 failed");

            console.log("  Whale 1:", whale1Amount / 1e18, "tokens (27%)");
            console.log("  Whale 2:", whale2Amount / 1e18, "tokens (27%)");
            console.log("  Whale 3:", whale3Amount / 1e18, "tokens (26%)");
        } else if (_stringsEqual(selectedScenario.tokenDistribution, "distributed")) {
            uint256 amountPerAddress = TOTAL_SUPPLY / 100;

            for (uint256 i = 0; i < 100; i++) {
                // casting to 'uint160' is safe because generated addresses use small bounded constants
                // forge-lint: disable-next-line(unsafe-typecast)
                address recipient = address(uint160(0x1000 + i));
                require(token.transfer(recipient, amountPerAddress), "transfer distributed failed");
            }

            console.log("  100 addresses receive:", amountPerAddress / 1e18, "tokens each");
        } else if (_stringsEqual(selectedScenario.tokenDistribution, "gaussian")) {
            uint256 avgAmount = TOTAL_SUPPLY / 50;

            for (uint256 i = 0; i < 50; i++) {
                // casting to 'uint160' is safe because generated addresses use small bounded constants
                // forge-lint: disable-next-line(unsafe-typecast)
                address recipient = address(uint160(0x2000 + i));
                uint256 amount;

                if (i < 5) {
                    amount = (avgAmount * 15) / 10;
                } else if (i < 15) {
                    amount = (avgAmount * 12) / 10;
                } else if (i < 35) {
                    amount = avgAmount;
                } else if (i < 45) {
                    amount = (avgAmount * 8) / 10;
                } else {
                    amount = (avgAmount * 5) / 10;
                }

                require(token.transfer(recipient, amount), "transfer gaussian failed");
            }

            console.log("  50 addresses with Gaussian distribution");
        } else if (_stringsEqual(selectedScenario.tokenDistribution, "equal")) {
            uint256 amountPerAddress = TOTAL_SUPPLY / 1000;

            console.log("  1000 addresses ready to receive:", amountPerAddress / 1e18, "tokens each");
            console.log("  (Minting to 1000 addresses batched to save gas)");

            for (uint256 i = 0; i < 100; i++) {
                // casting to 'uint160' is safe because generated addresses use small bounded constants
                // forge-lint: disable-next-line(unsafe-typecast)
                address recipient = address(uint160(0x3000 + i));
                require(token.transfer(recipient, amountPerAddress), "transfer equal failed");
            }
        }

        console.log("PASS: Token distribution complete");
    }

    function _setupTreasury() internal {
        address[] memory signers = new address[](1);
        signers[0] = msg.sender;

        MockTreasury treasury = new MockTreasury(signers, 1, TOTAL_SUPPLY / 2);
        deployedContracts.mockTreasury = address(treasury);

        console.log("PASS: Mock Treasury deployed at:", address(treasury));

        GovernanceToken token = GovernanceToken(deployedContracts.govToken);
        uint256 targetTreasuryFunds = TOTAL_SUPPLY / 10;
        uint256 available = token.balanceOf(msg.sender);
        uint256 treasuryFunds = available < targetTreasuryFunds ? available : targetTreasuryFunds;

        if (treasuryFunds == 0) {
            console.log("WARN: No remaining admin balance to fund treasury in this scenario");
            return;
        }

        token.approve(address(treasury), treasuryFunds);
        treasury.depositToken(address(token), treasuryFunds);

        console.log("PASS: Treasury funded with:", treasuryFunds / 1e18, "tokens");
    }

    // Reporting
    function _printScenarioReport() internal view {
        console.log("");
        console.log("[SCENARIO SETUP COMPLETE]");
        console.log("");
        console.log("Scenario Configuration:");
        console.log("--------------------------------------------------");
        console.log("Name: ", selectedScenario.name);
        console.log("Quorum Percentage: ", selectedScenario.quorumPercentage, "%");
        console.log("Proposal Threshold: ", selectedScenario.proposalThreshold, "%");
        console.log("Has Timelock: ", selectedScenario.hasTimelock);
        if (selectedScenario.hasTimelock) {
            console.log("Timelock Delay: ", selectedScenario.timelockDelay, " seconds");
        }
        console.log("Token Distribution: ", selectedScenario.tokenDistribution);
        console.log("Number of Addresses: ", selectedScenario.numAddresses);

        console.log("");
        console.log("Deployed Contracts:");
        console.log("--------------------------------------------------");
        console.log("Gov Token: ", deployedContracts.govToken);
        console.log("Governor Vulnerable: ", deployedContracts.governorVulnerable);
        console.log("Governor Defended: ", deployedContracts.governorDefended);
        if (selectedScenario.hasTimelock) {
            console.log("Timelock: ", deployedContracts.timelock);
        }
        console.log("Mock Treasury: ", deployedContracts.mockTreasury);

        console.log("");
        console.log("Next Steps:");
        console.log("--------------------------------------------------");
        console.log("1. Run attack simulations: forge script script/SimulateAttacks.s.sol");
        console.log("2. Export results: forge script script/ExportData.s.sol");
        console.log("3. Run tests: forge test");
        console.log("");
    }

    // Utilities
    function _stringsEqual(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    // Getters
    function getDeployedAddresses() external view returns (DeploymentAddresses memory) {
        return deployedContracts;
    }

    function getScenarioConfig() external view returns (ScenarioConfig memory) {
        return selectedScenario;
    }
}
