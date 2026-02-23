// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {GovernanceToken} from "../src/governance/GovernanceToken.sol";
import {Timelock} from "../src/governance/Timelock.sol";
import {GovernorBase} from "../src/governance/GovernorBase.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

contract DeployGovernance is Script {
    GovernanceToken public token;
    Timelock public timelock;
    GovernorBase public governor;

    // Config
    uint256 public constant MIN_DELAY = 1 days; // Timelock min delay
    uint256 public constant INITIAL_SUPPLY = 100_000e18; // 100k tokens
    uint48 public constant VOTING_DELAY = 1 days; // 1 day (assuming block time, or seconds if in timestamp mode)
    uint32 public constant VOTING_PERIOD = 1 weeks; // 1 week
    uint256 public constant PROPOSAL_THRESHOLD = 0;
    uint256 public constant QUORUM_PERCENTAGE = 4; // 4%

    function run() public {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        address deployer = deployerPrivateKey == 0 ? address(this) : vm.addr(deployerPrivateKey);

        // If PRIVATE_KEY is set, use it. Otherwise, use msg.sender (e.g. for --broadcast without key)
        if (deployerPrivateKey != 0) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast();
            deployer = msg.sender;
        }

        console.log("Deploying Governance System...");
        console.log("Deployer:", deployer);

        // 1. Deploy Governance Token
        // Using deployer as initial owner and minter
        token = new GovernanceToken("CityU Governance Token", "CGT", deployer, INITIAL_SUPPLY);
        console.log("GovernanceToken deployed at:", address(token));

        // Delegate votes to self to enable voting power immediately for testing if needed
        // Note: In production, delegation is a user action. Done here for initial setup convenience.
        token.delegate(deployer);
        console.log("Delegated votes to deployer");

        // 2. Deploy Timelock
        // Proposers and Executors will be set to the Governor later
        // Admin is deployer for now to complete setup
        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](0);
        timelock = new Timelock(MIN_DELAY, proposers, executors, deployer);
        console.log("Timelock deployed at:", address(timelock));

        // 3. Deploy Governor
        governor = new GovernorBase(
            "CityU Governor", token, timelock, VOTING_DELAY, VOTING_PERIOD, PROPOSAL_THRESHOLD, QUORUM_PERCENTAGE
        );
        console.log("Governor deployed at:", address(governor));

        // 4. Setup Roles
        // Governor needs PROPOSER_ROLE on Timelock
        bytes32 proposerRole = timelock.PROPOSER_ROLE();
        bytes32 executorRole = timelock.EXECUTOR_ROLE();
        bytes32 cancellerRole = timelock.CANCELLER_ROLE();
        // bytes32 adminRole = timelock.DEFAULT_ADMIN_ROLE();

        timelock.grantRole(proposerRole, address(governor));
        timelock.grantRole(executorRole, address(0)); // Allow anyone to execute if time has passed
        timelock.grantRole(cancellerRole, address(governor));
        console.log("Granted Timelock roles to Governor");

        // Renounce Admin role from deployer so only Timelock governs itself?
        // Usually done in production. For now keeping it might be useful or user can uncomment.
        // timelock.renounceRole(adminRole, deployer);
        // console.log("Renounced Timelock Admin role");

        vm.stopBroadcast();
    }
}
