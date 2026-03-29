// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

// Core Governance Contracts
import {GovernanceToken} from "../src/governance/GovernanceToken.sol";
import {GovernorBase} from "../src/governance/GovernorBase.sol";
import {GovernorVulnerable, ITokenVotes as ITokenVotesVulnerable} from "../src/governance/GovernorVulnerable.sol";
import {GovernorWithDefenses, ITokenVotes as ITokenVotesDefenses} from "../src/governance/GovernorWithDefenses.sol";
import {Timelock as GovernanceTimelock} from "../src/governance/Timelock.sol";
import {TimeBasedDefenseConfig} from "../src/defenses/TimeBasedDefense.sol";

// Attack Contracts
import {FlashLoanAttack} from "../src/attacks/FlashLoanAttack.sol";
import {WhaleManipulation} from "../src/attacks/WhaleManipulation.sol";
import {ProposalSpam} from "../src/attacks/ProposalSpam.sol";
import {QuorumManipulation} from "../src/attacks/QuorumManipulation.sol";
import {TimelockExploit} from "../src/attacks/TimelockExploit.sol";

// Mock Contracts
import {MockFlashLoanProvider} from "../src/mocks/MockFlashLoanProvider.sol";
import {MockToken} from "../src/mocks/MockToken.sol";
import {MockTreasury} from "../src/mocks/MockTreasury.sol";

/**
 * @title Deploy
 * @dev Foundry script to deploy all governance and attack simulation contracts
 *
 * Usage:
 *   forge script script/Deploy.s.sol:Deploy --rpc-url http://localhost:8545 --broadcast
 *
 * Environment variables:
 *   DEPLOYER_KEY: Private key for deployment account
 *   ADMIN: Admin address (defaults to msg.sender)
 */
contract Deploy is Script {
    // ─────────────────────────────────────────────────────────────────────────
    // Deployed Contracts
    // ─────────────────────────────────────────────────────────────────────────

    address public deployedGovToken;
    address public deployedGovernorBase;
    address public deployedGovernorVulnerable;
    address public deployedGovernorWithDefenses;
    address public deployedTimelock;

    address public deployedFlashLoanProvider;
    address public deployedMockToken;
    address public deployedMockTreasury;

    address public deployedFlashLoanAttack;
    address public deployedWhaleManipulation;
    address public deployedProposalSpam;
    address public deployedQuorumManipulation;
    address public deployedTimelockExploit;

    // ─────────────────────────────────────────────────────────────────────────
    // Configuration
    // ─────────────────────────────────────────────────────────────────────────

    uint256 private constant GOV_TOKEN_INITIAL_SUPPLY = 1_000_000_000e18; // 1 billion
    uint256 private constant VOTING_DELAY = 1; // 1 block
    uint256 private constant VOTING_PERIOD = 50400; // 1 week on Ethereum
    uint256 private constant PROPOSAL_THRESHOLD = 0; // 0 for vulnerable version
    uint256 private constant QUORUM_VOTES = 0; // 0 for vulnerable version
    uint256 private constant MOCK_TREASURY_SPENDING_LIMIT = 100_000e18; // 100k tokens
    string private constant DEPLOYMENT_JSON_FILE = "./analysis/data/raw/deployment_addresses.json";
    string private constant SIM_ENV_FILE = "./.env.simulation";

    // ─────────────────────────────────────────────────────────────────────────
    // Main Deployment Function
    // ─────────────────────────────────────────────────────────────────────────

    function run() external {
        // Get deployer address
        address admin = msg.sender;
        console.log("Deploying contracts with admin:", admin);

        // Start recording transactions
        vm.startBroadcast();

        // Step 1: Deploy Core Governance Contracts
        console.log("\n=== Deploying Core Governance Contracts ===");
        _deployGovernanceContracts(admin);

        // Step 2: Deploy Mock Contracts
        console.log("\n=== Deploying Mock Contracts ===");
        _deployMockContracts(admin);

        // Step 3: Deploy Attack Contracts
        console.log("\n=== Deploying Attack Contracts ===");
        _deployAttackContracts();

        // Stop recording transactions
        vm.stopBroadcast();

        // Log deployment summary
        _logDeploymentSummary();

        // Persist deployment addresses for downstream scripts.
        _writeDeploymentArtifacts();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Deployment Functions
    // ─────────────────────────────────────────────────────────────────────────

    function _deployGovernanceContracts(address admin) internal {
        // Deploy Governance Token
        console.log("Deploying GovernanceToken...");
        GovernanceToken govToken = new GovernanceToken("Governance Token", "GOV", admin, GOV_TOKEN_INITIAL_SUPPLY);
        deployedGovToken = address(govToken);
        console.log("GovernanceToken deployed at:", deployedGovToken);

        // Deploy Timelock
        console.log("Deploying Timelock...");
        GovernanceTimelock timelock = new GovernanceTimelock(
            TimeBasedDefenseConfig.standard().timelockDelay, new address[](0), new address[](0), admin
        );
        deployedTimelock = address(timelock);
        console.log("Timelock deployed at:", deployedTimelock);

        // Deploy GovernorBase (Secure Version)
        console.log("Deploying GovernorBase...");
        GovernorBase governorBase = new GovernorBase(
            "Governor Base",
            govToken,
            timelock,
            // casting to 'uint48' is safe because VOTING_DELAY is a small constant (1 block)
            // forge-lint: disable-next-line(unsafe-typecast)
            uint48(VOTING_DELAY),
            // casting to 'uint32' is safe because VOTING_PERIOD is a bounded constant (50400)
            // forge-lint: disable-next-line(unsafe-typecast)
            uint32(VOTING_PERIOD),
            1, // 1% proposal threshold
            4 // 4% quorum
        );
        deployedGovernorBase = address(governorBase);
        console.log("GovernorBase deployed at:", deployedGovernorBase);

        // Deploy GovernorVulnerable (Intentionally Vulnerable)
        console.log("Deploying GovernorVulnerable...");
        GovernorVulnerable governorVulnerable = new GovernorVulnerable(
            "Governor Vulnerable",
            ITokenVotesVulnerable(address(govToken)),
            VOTING_DELAY,
            VOTING_PERIOD,
            PROPOSAL_THRESHOLD,
            QUORUM_VOTES
        );
        deployedGovernorVulnerable = address(governorVulnerable);
        console.log("GovernorVulnerable deployed at:", deployedGovernorVulnerable);

        // Deploy GovernorWithDefenses (Protected Version)
        console.log("Deploying GovernorWithDefenses...");
        GovernorWithDefenses governorWithDefenses = new GovernorWithDefenses(
            "Governor With Defenses",
            ITokenVotesDefenses(address(govToken)),
            timelock,
            // casting to 'uint48' is safe because VOTING_DELAY is a small constant (1 block)
            // forge-lint: disable-next-line(unsafe-typecast)
            uint48(VOTING_DELAY),
            // casting to 'uint32' is safe because VOTING_PERIOD is a bounded constant (50400)
            // forge-lint: disable-next-line(unsafe-typecast)
            uint32(VOTING_PERIOD),
            1, // 1% proposal threshold
            4 // 4% quorum
        );
        deployedGovernorWithDefenses = address(governorWithDefenses);
        console.log("GovernorWithDefenses deployed at:", deployedGovernorWithDefenses);
    }

    function _deployMockContracts(address admin) internal {
        // Deploy Mock Flash Loan Provider
        console.log("Deploying MockFlashLoanProvider...");
        MockFlashLoanProvider flashLoanProvider = new MockFlashLoanProvider();
        deployedFlashLoanProvider = address(flashLoanProvider);
        console.log("MockFlashLoanProvider deployed at:", deployedFlashLoanProvider);

        // Fund flash loan provider with governance tokens from the admin's existing balance
        GovernanceToken govToken = GovernanceToken(deployedGovToken);
        require(
            govToken.transfer(deployedFlashLoanProvider, GOV_TOKEN_INITIAL_SUPPLY / 2),
            "transfer to flash loan provider failed"
        );
        console.log("Funded flash loan provider with tokens");

        // Deploy Mock Token
        console.log("Deploying MockToken...");
        MockToken mockToken = new MockToken(
            "Mock Test Token",
            "MOCK",
            admin,
            100_000_000e18 // 100 million tokens
        );
        deployedMockToken = address(mockToken);
        console.log("MockToken deployed at:", deployedMockToken);

        // Deploy Mock Treasury
        console.log("Deploying MockTreasury...");
        address[] memory signers = new address[](1);
        signers[0] = admin;
        MockTreasury mockTreasury = new MockTreasury(signers, 1, MOCK_TREASURY_SPENDING_LIMIT);
        deployedMockTreasury = address(mockTreasury);
        console.log("MockTreasury deployed at:", deployedMockTreasury);

        // Fund the treasury
        mockToken.mint(admin, 10_000_000e18); // 10 million - mint to admin (broadcaster)
        MockTreasury treasury = MockTreasury(payable(deployedMockTreasury));
        mockToken.approve(deployedMockTreasury, 10_000_000e18);
        treasury.depositToken(deployedMockToken, 10_000_000e18);
        console.log("Funded treasury with mock tokens");
    }

    function _deployAttackContracts() internal {
        // Deploy Flash Loan Attack
        console.log("Deploying FlashLoanAttack...");
        FlashLoanAttack flashLoanAttack = new FlashLoanAttack(
            deployedFlashLoanProvider, deployedGovToken, deployedGovernorVulnerable, deployedMockTreasury
        );
        deployedFlashLoanAttack = address(flashLoanAttack);
        console.log("FlashLoanAttack deployed at:", deployedFlashLoanAttack);

        // Deploy Whale Manipulation Attack
        console.log("Deploying WhaleManipulation...");
        WhaleManipulation whaleManipulation =
            new WhaleManipulation(deployedGovToken, deployedGovernorVulnerable, deployedMockTreasury);
        deployedWhaleManipulation = address(whaleManipulation);
        console.log("WhaleManipulation deployed at:", deployedWhaleManipulation);

        // Deploy Proposal Spam Attack
        console.log("Deploying ProposalSpam...");
        ProposalSpam proposalSpam = new ProposalSpam(deployedGovernorVulnerable);
        deployedProposalSpam = address(proposalSpam);
        console.log("ProposalSpam deployed at:", deployedProposalSpam);

        // Deploy Quorum Manipulation Attack
        console.log("Deploying QuorumManipulation...");
        QuorumManipulation quorumManipulation =
            new QuorumManipulation(deployedGovToken, deployedGovernorVulnerable, deployedMockTreasury);
        deployedQuorumManipulation = address(quorumManipulation);
        console.log("QuorumManipulation deployed at:", deployedQuorumManipulation);

        // Deploy Timelock Exploit Attack
        console.log("Deploying TimelockExploit...");
        TimelockExploit timelockExploit =
            new TimelockExploit(deployedGovernorVulnerable, deployedTimelock, deployedMockTreasury);
        deployedTimelockExploit = address(timelockExploit);
        console.log("TimelockExploit deployed at:", deployedTimelockExploit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Logging Functions
    // ─────────────────────────────────────────────────────────────────────────

    function _logDeploymentSummary() internal view {
        console.log("\n");
        console.log("[DEPLOYMENT SUMMARY - ALL CONTRACTS]");

        console.log("\nCORE GOVERNANCE CONTRACTS:");
        console.log("  GovernanceToken:        ", deployedGovToken);
        console.log("  GovernorBase:           ", deployedGovernorBase);
        console.log("  GovernorVulnerable:     ", deployedGovernorVulnerable);
        console.log("  GovernorWithDefenses:   ", deployedGovernorWithDefenses);
        console.log("  Timelock:               ", deployedTimelock);

        console.log("\nMOCK CONTRACTS:");
        console.log("  MockFlashLoanProvider:  ", deployedFlashLoanProvider);
        console.log("  MockToken:              ", deployedMockToken);
        console.log("  MockTreasury:           ", deployedMockTreasury);

        console.log("\nATTACK CONTRACTS:");
        console.log("  FlashLoanAttack:        ", deployedFlashLoanAttack);
        console.log("  WhaleManipulation:      ", deployedWhaleManipulation);
        console.log("  ProposalSpam:           ", deployedProposalSpam);
        console.log("  QuorumManipulation:     ", deployedQuorumManipulation);
        console.log("  TimelockExploit:        ", deployedTimelockExploit);

        console.log("\nAll contracts deployed successfully!");
        console.log("===================================================================\n");
    }

    function _writeDeploymentArtifacts() internal {
        string memory json = string(
            abi.encodePacked(
                "{\n",
                '  "governance": {\n',
                '    "govToken": "',
                vm.toString(deployedGovToken),
                '",\n',
                '    "governorBase": "',
                vm.toString(deployedGovernorBase),
                '",\n',
                '    "governorVulnerable": "',
                vm.toString(deployedGovernorVulnerable),
                '",\n',
                '    "governorWithDefenses": "',
                vm.toString(deployedGovernorWithDefenses),
                '",\n',
                '    "timelock": "',
                vm.toString(deployedTimelock),
                '"\n',
                "  },\n",
                '  "mocks": {\n',
                '    "flashLoanProvider": "',
                vm.toString(deployedFlashLoanProvider),
                '",\n',
                '    "mockToken": "',
                vm.toString(deployedMockToken),
                '",\n',
                '    "mockTreasury": "',
                vm.toString(deployedMockTreasury),
                '"\n',
                "  },\n",
                '  "attacks": {\n',
                '    "flashLoanAttack": "',
                vm.toString(deployedFlashLoanAttack),
                '",\n',
                '    "whaleManipulation": "',
                vm.toString(deployedWhaleManipulation),
                '",\n',
                '    "proposalSpam": "',
                vm.toString(deployedProposalSpam),
                '",\n',
                '    "quorumManipulation": "',
                vm.toString(deployedQuorumManipulation),
                '",\n',
                '    "timelockExploit": "',
                vm.toString(deployedTimelockExploit),
                '"\n',
                "  }\n",
                "}\n"
            )
        );

        // forge-lint: disable-next-line(unsafe-cheatcode)
        vm.writeFile(DEPLOYMENT_JSON_FILE, json);

        string memory envFile = string(
            abi.encodePacked(
                "# Auto-generated by script/Deploy.s.sol\n",
                "GOV_TOKEN_ADDRESS=",
                vm.toString(deployedGovToken),
                "\n",
                "GOVERNOR_VULNERABLE_ADDRESS=",
                vm.toString(deployedGovernorVulnerable),
                "\n",
                "GOVERNOR_DEFENSES_ADDRESS=",
                vm.toString(deployedGovernorWithDefenses),
                "\n",
                "MOCK_TREASURY_ADDRESS=",
                vm.toString(deployedMockTreasury),
                "\n",
                "FLASH_LOAN_PROVIDER_ADDRESS=",
                vm.toString(deployedFlashLoanProvider),
                "\n",
                "TIMELOCK_ADDRESS=",
                vm.toString(deployedTimelock),
                "\n",
                "TIMELOCK=",
                vm.toString(deployedTimelock),
                "\n"
            )
        );

        // forge-lint: disable-next-line(unsafe-cheatcode)
        vm.writeFile(SIM_ENV_FILE, envFile);

        console.log("Deployment address manifest written to:", DEPLOYMENT_JSON_FILE);
        console.log("Simulation env file written to:", SIM_ENV_FILE);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper Functions
    // ─────────────────────────────────────────────────────────────────────────

    function getDeploymentAddresses()
        public
        view
        returns (address govToken, address governorVulnerable, address mockTreasury, address flashLoanAttack)
    {
        return (deployedGovToken, deployedGovernorVulnerable, deployedMockTreasury, deployedFlashLoanAttack);
    }
}
