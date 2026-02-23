// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GovernanceToken} from "../src/governance/GovernanceToken.sol";
import {Timelock} from "../src/governance/Timelock.sol";
import {GovernorBase} from "../src/governance/GovernorBase.sol";

contract BaseTest is Test {
    GovernanceToken public token;
    Timelock public timelock;
    GovernorBase public governor;

    address public admin = makeAddr("admin");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public user3 = makeAddr("user3");

    uint256 public constant INITIAL_SUPPLY = 100_000e18;
    uint256 public constant MIN_DELAY = 1 days;
    uint48 public constant VOTING_DELAY = 1 days; // 7200 blocks assuming 12s block time, usually expressed in blocks or seconds depending on clock mode. OpenZeppelin Governor usually uses Clock (block number or timestamp).
    // GovernorSettings uses uint48 for votingDelay and uint32 for votingPeriod.
    // Default OpenZeppelin Governor uses block number (IVotes).
    
    // Let's use smaller values for testing
    uint48 public constant TEST_VOTING_DELAY = 10; // blocks
    uint32 public constant TEST_VOTING_PERIOD = 100; // blocks
    uint256 public constant TEST_PROPOSAL_THRESHOLD = 0;
    uint256 public constant TEST_QUORUM_PERCENTAGE = 4; // 4%

    function setUp() public virtual {
        // 1. Deploy Governance Token
        vm.startPrank(admin);
        token = new GovernanceToken("Governance Token", "GOV", admin, INITIAL_SUPPLY);
        
        // 2. Deploy Timelock
        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](0);
        timelock = new Timelock(MIN_DELAY, proposers, executors, admin);

        // 3. Deploy Governor
        // Note: Governor needs to be a proposer in Timelock
        governor = new GovernorBase(
            "DAO Governor",
            token,
            timelock,
            TEST_VOTING_DELAY,
            TEST_VOTING_PERIOD,
            TEST_PROPOSAL_THRESHOLD,
            TEST_QUORUM_PERCENTAGE
        );

        // 4. Setup Roles
        // Grant Proposer role to Governor
        bytes32 proposerRole = timelock.PROPOSER_ROLE();
        bytes32 executorRole = timelock.EXECUTOR_ROLE();
        bytes32 adminRole = timelock.DEFAULT_ADMIN_ROLE();

        timelock.grantRole(proposerRole, address(governor));
        timelock.grantRole(executorRole, address(0)); // Allow anyone to execute
        timelock.revokeRole(adminRole, admin); // Revoke admin role from deployer for security

        // Distribute tokens and delegate
        token.transfer(user1, 10_000e18);
        token.transfer(user2, 10_000e18);
        token.transfer(user3, 10_000e18);
        vm.stopPrank();

        // Users verify delegation
        vm.prank(user1);
        token.delegate(user1);
        
        vm.prank(user2);
        token.delegate(user2);

        vm.prank(user3);
        token.delegate(user3);
    }
}
