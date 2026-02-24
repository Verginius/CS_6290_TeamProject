// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GovernanceToken} from "../src/governance/GovernanceToken.sol";
import {Timelock} from "../src/governance/Timelock.sol";
import {GovernorBase} from "../src/governance/GovernorBase.sol";

/**
 * @title BaseTest
 * @dev Shared Forge test fixture inherited by GovernorBaseTest.
 *      Bootstraps the complete governance stack and provides a set of
 *      pre-funded, pre-delegated test actors.
 *
 * ============================================================
 * WHAT IS SET UP IN setUp()
 * ============================================================
 *
 * 1. GovernanceToken  — minted with INITIAL_SUPPLY to admin.
 * 2. Timelock         — MIN_DELAY = 1 day; admin holds DEFAULT_ADMIN_ROLE
 *                        initially; revoked at the end of setUp().
 * 3. GovernorBase     — wired to token + timelock with reduced test
 *                        parameters (10-block delay, 100-block period).
 * 4. Roles            — PROPOSER / EXECUTOR / CANCELLER granted to governor;
 *                        deployer admin role revoked for security.
 * 5. Token distribution — 10 000 tokens each to user1, user2, user3.
 * 6. Delegation       — each user self-delegates to activate vote weight.
 *
 * ============================================================
 * TEST ACTORS
 * ============================================================
 *
 * admin  — deploys and configures the stack; holds no residual privileges.
 * user1  — 10 000 GOV, self-delegated (primary proposer in most tests).
 * user2  — 10 000 GOV, self-delegated.
 * user3  — 10 000 GOV, self-delegated.
 *
 * ============================================================
 */
contract BaseTest is Test {
    // ─────────────────────────────────────────────────────────────────────────
    // Contracts
    // ─────────────────────────────────────────────────────────────────────────

    GovernanceToken public token;
    Timelock public timelock;
    GovernorBase public governor;

    // ─────────────────────────────────────────────────────────────────────────
    // Actors
    // ─────────────────────────────────────────────────────────────────────────

    address public admin = makeAddr("admin");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public user3 = makeAddr("user3");

    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Total supply minted to admin at deployment.
    uint256 public constant INITIAL_SUPPLY = 100_000e18;
    /// @dev Timelock minimum execution delay.
    uint256 public constant MIN_DELAY = 1 days;
    /// @dev Voting delay used in production config (not used in these tests).
    uint48 public constant VOTING_DELAY = 1 days;

    // Reduced values for faster test execution.
    /// @dev Voting delay for tests (blocks).
    uint48 public constant TEST_VOTING_DELAY = 10;
    /// @dev Voting period for tests (blocks).
    uint32 public constant TEST_VOTING_PERIOD = 100;
    /// @dev Proposal threshold for tests.
    uint256 public constant TEST_PROPOSAL_THRESHOLD = 0;
    /// @dev Quorum percentage for tests.
    uint256 public constant TEST_QUORUM_PERCENTAGE = 4;

    // ─────────────────────────────────────────────────────────────────────────
    // Setup
    // ─────────────────────────────────────────────────────────────────────────

    function setUp() public virtual {
        vm.startPrank(admin);

        // 1. Deploy Governance Token.
        token = new GovernanceToken("Governance Token", "GOV", admin, INITIAL_SUPPLY);

        // 2. Deploy Timelock.
        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](0);
        timelock = new Timelock(MIN_DELAY, proposers, executors, admin);

        // 3. Deploy Governor — needs to be a proposer in the Timelock.
        governor = new GovernorBase(
            "DAO Governor",
            token,
            timelock,
            TEST_VOTING_DELAY,
            TEST_VOTING_PERIOD,
            TEST_PROPOSAL_THRESHOLD,
            TEST_QUORUM_PERCENTAGE
        );

        // 4. Wire Timelock roles.
        bytes32 proposerRole = timelock.PROPOSER_ROLE();
        bytes32 executorRole = timelock.EXECUTOR_ROLE();
        bytes32 adminRole = timelock.DEFAULT_ADMIN_ROLE();

        timelock.grantRole(proposerRole, address(governor));
        timelock.grantRole(executorRole, address(0)); // anyone can execute when delay is met
        timelock.revokeRole(adminRole, admin); // revoke deployer admin for security

        // 5. Distribute tokens.
        require(token.transfer(user1, 10_000e18), "transfer failed");
        require(token.transfer(user2, 10_000e18), "transfer failed");
        require(token.transfer(user3, 10_000e18), "transfer failed");
        vm.stopPrank();

        // 6. Each user self-delegates to activate voting power.
        vm.prank(user1);
        token.delegate(user1);

        vm.prank(user2);
        token.delegate(user2);

        vm.prank(user3);
        token.delegate(user3);
    }
}
