// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {GovernanceToken} from "../src/governance/GovernanceToken.sol";
import {Timelock} from "../src/governance/Timelock.sol";
import {GovernorBase} from "../src/governance/GovernorBase.sol";

/**
 * @title DeployGovernance
 * @dev Forge deployment script that provisions the full governance stack
 *      (token → timelock → governor) and wires the required access-control
 *      roles on the Timelock.
 *
 * ============================================================
 * DEPLOYMENT SEQUENCE
 * ============================================================
 *
 * Step 1  — Deploy GovernanceToken
 *           Mints INITIAL_SUPPLY to the deployer and self-delegates so
 *           the deployer has immediate voting power for post-deploy setup.
 *
 * Step 2  — Deploy Timelock
 *           Starts with empty proposers / executors arrays; roles are
 *           wired in Step 4.  Deployer holds DEFAULT_ADMIN_ROLE initially.
 *
 * Step 3  — Deploy GovernorBase
 *           Connects to the token and timelock deployed above.
 *
 * Step 4  — Configure Timelock roles
 *           PROPOSER_ROLE  → GovernorBase
 *           EXECUTOR_ROLE  → address(0)  (open execution after delay)
 *           CANCELLER_ROLE → GovernorBase
 *
 * ============================================================
 * ENVIRONMENT VARIABLES
 * ============================================================
 *
 * PRIVATE_KEY (optional)  — hex private key for the deployer account.
 *                             If absent the script broadcasts as msg.sender
 *                             (suitable for local Anvil runs with --unlocked).
 *
 * ============================================================
 */
contract DeployGovernance is Script {
    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    GovernanceToken public token;
    Timelock public timelock;
    GovernorBase public governor;

    // ─────────────────────────────────────────────────────────────────────────
    // Deployment config
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Minimum timelock delay before a queued proposal can execute.
    uint256 public constant MIN_DELAY = 1 days;
    /// @dev Initial token supply minted to the deployer.
    uint256 public constant INITIAL_SUPPLY = 100_000e18;
    /// @dev Blocks/seconds before voting opens after a proposal is submitted.
    uint48 public constant VOTING_DELAY = 1 days;
    /// @dev Blocks/seconds the voting window stays open.
    uint32 public constant VOTING_PERIOD = 1 weeks;
    /// @dev Minimum vote weight to create a proposal (0 = no threshold).
    uint256 public constant PROPOSAL_THRESHOLD = 0;
    /// @dev Percentage of total supply that must vote for quorum.
    uint256 public constant QUORUM_PERCENTAGE = 4;

    // ─────────────────────────────────────────────────────────────────────────
    // Entry point
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Deploys the full governance system (token, timelock, governor)
    ///         and wires up the required timelock roles.
    function run() public {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        address deployer = deployerPrivateKey == 0 ? address(this) : vm.addr(deployerPrivateKey);

        // If PRIVATE_KEY is set, use it; otherwise broadcast as msg.sender (e.g. Anvil).
        if (deployerPrivateKey != 0) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast();
            deployer = msg.sender;
        }

        console.log("Deploying Governance System...");
        console.log("Deployer:", deployer);

        // 1. Deploy Governance Token — deployer receives initial supply.
        token = new GovernanceToken("CityU Governance Token", "CGT", deployer, INITIAL_SUPPLY);
        console.log("GovernanceToken deployed at:", address(token));

        // Self-delegate so the deployer has immediate voting power for setup/testing.
        // In production this is a per-user action.
        token.delegate(deployer);
        console.log("Delegated votes to deployer");

        // 2. Deploy Timelock — proposers/executors are empty; set via roles below.
        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](0);
        timelock = new Timelock(MIN_DELAY, proposers, executors, deployer);
        console.log("Timelock deployed at:", address(timelock));

        // 3. Deploy Governor.
        governor = new GovernorBase(
            "CityU Governor", token, timelock, VOTING_DELAY, VOTING_PERIOD, PROPOSAL_THRESHOLD, QUORUM_PERCENTAGE
        );
        console.log("Governor deployed at:", address(governor));

        // 4. Wire Timelock roles — governor proposes/cancels; anyone can execute.
        bytes32 proposerRole = timelock.PROPOSER_ROLE();
        bytes32 executorRole = timelock.EXECUTOR_ROLE();
        bytes32 cancellerRole = timelock.CANCELLER_ROLE();

        timelock.grantRole(proposerRole, address(governor));
        timelock.grantRole(executorRole, address(0));
        timelock.grantRole(cancellerRole, address(governor));
        console.log("Granted Timelock roles to Governor");

        // Optionally renounce the deployer's admin role so only the Timelock
        // governs itself going forward (uncomment for production deploys):
        // bytes32 adminRole = timelock.DEFAULT_ADMIN_ROLE();
        // timelock.renounceRole(adminRole, deployer);
        // console.log("Renounced Timelock Admin role");

        vm.stopBroadcast();
    }
}
