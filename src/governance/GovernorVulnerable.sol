// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GovernorVulnerable
 * @dev Intentionally vulnerable governance contract for security research and attack simulation.
 *
 * ============================================================
 * KNOWN VULNERABILITIES (intentional, for research purposes)
 * ============================================================
 *
 * VULN-1: Flash-loan voting — voting weight is read from the token at vote-time
 *         (getVotes) instead of at proposal-creation time (getPastVotes).
 *         An attacker can borrow tokens, vote, then repay in the same transaction.
 *
 * VULN-2: No double-vote protection — the `hasVoted` mapping exists but the
 *         guard is never enforced, so any address can cast unlimited votes.
 *
 * VULN-3: No timelock — proposals execute immediately after the voting period
 *         ends with no waiting period for token holders to react.
 *
 * VULN-4: Zero proposal threshold — any address (even with 0 tokens) can
 *         create a proposal, enabling spam / griefing.
 *
 * VULN-5: Zero quorum — a proposal succeeds even if only one vote is cast,
 *         allowing minority capture of governance.
 *
 * VULN-6: Reentrancy in execute — the `executed` flag is set AFTER external
 *         calls are dispatched (CEI pattern violated).  A malicious target
 *         contract can re-enter `execute` before the flag is written.
 *
 * VULN-7: Proposer-controlled cancellation — the proposer can cancel any
 *         proposal at any time, including after voting has started, enabling
 *         griefing or vote-outcome manipulation.
 *
 * VULN-8: Unchecked calldatas length — `execute` does not validate that
 *         `targets`, `values`, and `calldatas` arrays are the same length as
 *         those stored at proposal time, opening up parameter-confused execution.
 *
 * ============================================================
 */
interface ITokenVotes {
    /// @dev Returns current (un-snapshotted) delegated vote weight. Used intentionally for VULN-1.
    function getVotes(address account) external view returns (uint256);
    /// @dev Would be the safe alternative: getPastVotes(account, timepoint).
    function getPastVotes(address account, uint256 timepoint) external view returns (uint256);
}

contract GovernorVulnerable {
    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Lifecycle states for a proposal.
    enum ProposalState {
        Pending, // 0 – created, voting not yet started
        Active, // 1 – voting window is open
        Succeeded, // 2 – voting ended, for > against
        Defeated, // 3 – voting ended, for <= against
        Canceled, // 4 – manually canceled by proposer
        Executed // 5 – proposal actions have been dispatched
    }

    struct ProposalVotes {
        uint256 forVotes; // votes in favour
        uint256 againstVotes; // votes against
        uint256 abstainVotes; // abstain votes (counted for quorum in safe versions)
    }

    struct Proposal {
        address proposer;
        uint256 voteStart; // first block where voting is allowed
        uint256 voteEnd; // last block where voting is allowed (inclusive)
        bool canceled;
        bool executed;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        bytes32 descriptionHash;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────────────────────

    string public name;

    /// @notice The voting token.  Vote weight is queried live (VULN-1).
    ITokenVotes public immutable TOKEN;

    /// @notice Delay in blocks between proposal creation and voting start.
    uint256 public votingDelay;

    /// @notice Duration in blocks of the voting window.
    uint256 public votingPeriod;

    /// @notice VULN-4: proposalThreshold is 0 — anyone can propose.
    uint256 public proposalThreshold;

    /// @notice VULN-5: quorumVotes is 0 — any positive majority suffices.
    uint256 public quorumVotes;

    mapping(uint256 => Proposal) internal _proposals;
    mapping(uint256 => ProposalVotes) internal _proposalVotes;

    // VULN-2: This mapping is never actually enforced in castVote.
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    uint256 private _proposalCount;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address[] targets,
        uint256[] values,
        bytes[] calldatas,
        string description,
        uint256 voteStart,
        uint256 voteEnd
    );

    event VoteCast(
        address indexed voter, uint256 indexed proposalId, uint8 support, uint256 weight, string reason
    );

    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(
        string memory _name,
        ITokenVotes _token,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold, // intended to be 0 for VULN-4
        uint256 _quorumVotes // intended to be 0 for VULN-5
    ) {
        name = _name;
        TOKEN = _token;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        proposalThreshold = _proposalThreshold;
        quorumVotes = _quorumVotes;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Proposal lifecycle helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the current state of a proposal.
     * @dev Implements the full Pending → Active → Succeeded/Defeated → Executed / Canceled
     *      lifecycle.
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage p = _proposals[proposalId];
        require(p.voteStart != 0, "GovernorVulnerable: unknown proposal");

        if (p.canceled) return ProposalState.Canceled;
        if (p.executed) return ProposalState.Executed;

        if (block.number <= p.voteStart) return ProposalState.Pending;
        if (block.number <= p.voteEnd) return ProposalState.Active;

        // Voting ended — check outcome
        ProposalVotes storage v = _proposalVotes[proposalId];

        // VULN-5: quorumVotes == 0 means this condition is always met.
        bool quorumReached = (v.forVotes + v.againstVotes + v.abstainVotes) >= quorumVotes;

        // VULN-7 (minor): strict > means ties go to Defeated, acceptable here.
        bool votingSucceeded = quorumReached && (v.forVotes > v.againstVotes);

        return votingSucceeded ? ProposalState.Succeeded : ProposalState.Defeated;
    }

    /**
     * @notice Derives the deterministic proposal ID from its contents.
     */
    function hashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public pure returns (uint256) {
        return uint256(keccak256(abi.encode(targets, values, calldatas, descriptionHash)));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Core governance actions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Create a new governance proposal.
     *
     * @dev VULN-4: No proposal threshold check — any address may call this,
     *      including addresses with zero token balance.
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256 proposalId) {
        // VULN-4: The threshold check below is intentionally commented out.
        // Safe version would be:
        //   require(TOKEN.getVotes(msg.sender) >= proposalThreshold, "below threshold");

        bytes32 descriptionHash;
        assembly ("memory-safe") {
            descriptionHash := keccak256(add(description, 0x20), mload(description))
        }
        proposalId = hashProposal(targets, values, calldatas, descriptionHash);

        require(_proposals[proposalId].voteStart == 0, "GovernorVulnerable: proposal already exists");

        uint256 voteStart = block.number + votingDelay;
        uint256 voteEnd = voteStart + votingPeriod;

        _proposals[proposalId] = Proposal({
            proposer: msg.sender,
            voteStart: voteStart,
            voteEnd: voteEnd,
            canceled: false,
            executed: false,
            targets: targets,
            values: values,
            calldatas: calldatas,
            descriptionHash: descriptionHash
        });

        emit ProposalCreated(proposalId, msg.sender, targets, values, calldatas, description, voteStart, voteEnd);
    }

    /**
     * @notice Cast a vote on a proposal.
     *
     * @dev VULN-1: Vote weight is token.getVotes(msg.sender) at the time of
     *              the call, NOT getPastVotes at the proposal snapshot block.
     *              This is exploitable via flash loans.
     *
     *      VULN-2: The hasVoted guard is deliberately NOT enforced.  Any address
     *              can call castVote multiple times on the same proposal.
     *
     * @param proposalId The proposal to vote on.
     * @param support    0 = Against, 1 = For, 2 = Abstain.
     */
    function castVote(uint256 proposalId, uint8 support) external returns (uint256 weight) {
        return _castVote(proposalId, msg.sender, support, "");
    }

    /**
     * @notice Cast a vote with an optional reason string.
     */
    function castVoteWithReason(uint256 proposalId, uint8 support, string calldata reason)
        external
        returns (uint256 weight)
    {
        return _castVote(proposalId, msg.sender, support, reason);
    }

    /**
     * @dev Internal vote casting.
     *
     *      VULN-1: reads live vote weight, not historical snapshot.
     *      VULN-2: never reverts on double-vote (hasVoted is written but never read as a guard).
     */
    function _castVote(uint256 proposalId, address voter, uint8 support, string memory reason)
        internal
        returns (uint256 weight)
    {
        require(state(proposalId) == ProposalState.Active, "GovernorVulnerable: voting not active");
        require(support <= 2, "GovernorVulnerable: invalid support value");

        // VULN-1: Current balance instead of snapshot.
        // Safe version: weight = TOKEN.getPastVotes(voter, _proposals[proposalId].voteStart);
        weight = TOKEN.getVotes(voter);

        // VULN-2: Guard intentionally absent.
        // Safe version: require(!hasVoted[proposalId][voter], "already voted");
        hasVoted[proposalId][voter] = true; // written but never enforced as a guard

        ProposalVotes storage v = _proposalVotes[proposalId];
        if (support == 0) {
            v.againstVotes += weight;
        } else if (support == 1) {
            v.forVotes += weight;
        } else {
            v.abstainVotes += weight;
        }

        emit VoteCast(voter, proposalId, support, weight, reason);
    }

    /**
     * @notice Execute a succeeded proposal.
     *
     * @dev VULN-3: No timelock — execution is immediate once voting ends.
     *      VULN-6: The `executed` flag is set AFTER external calls, violating
     *              the Checks-Effects-Interactions (CEI) pattern.  A malicious
     *              target contract can re-enter this function before the state
     *              is updated and execute the proposal multiple times.
     *      VULN-8: calldatas / targets / values are passed in by the caller and
     *              are not validated against stored values before execution.
     */
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external payable returns (uint256 proposalId) {
        proposalId = hashProposal(targets, values, calldatas, descriptionHash);

        require(state(proposalId) == ProposalState.Succeeded, "GovernorVulnerable: proposal not succeeded");

        // VULN-6: CEI violated — state written AFTER external calls.
        // Safe version: _proposals[proposalId].executed = true; (move this line here)

        for (uint256 i = 0; i < targets.length; ++i) {
            // VULN-8: No length-mismatch check against stored proposal data.
            (bool success, bytes memory returndata) = targets[i].call{value: values[i]}(calldatas[i]);
            _verifyCallResult(success, returndata);
        }

        // VULN-6: State update AFTER external calls (reentrancy window).
        _proposals[proposalId].executed = true;

        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Cancel a proposal.
     *
     * @dev VULN-7: Any proposer can cancel their proposal at any time —
     *      even during the active voting period — enabling griefing.
     */
    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external returns (uint256 proposalId) {
        proposalId = hashProposal(targets, values, calldatas, descriptionHash);
        Proposal storage p = _proposals[proposalId];

        require(
            state(proposalId) != ProposalState.Executed && state(proposalId) != ProposalState.Canceled,
            "GovernorVulnerable: proposal already terminal"
        );
        // VULN-7: Only requires msg.sender == proposer; no restriction on timing.
        require(msg.sender == p.proposer, "GovernorVulnerable: not proposer");

        p.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the raw vote tallies for a proposal.
     * @return againstVotes Votes cast against.
     * @return forVotes     Votes cast in favour.
     * @return abstainVotes Abstain votes.
     */
    function proposalVotes(uint256 proposalId)
        external
        view
        returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)
    {
        ProposalVotes storage v = _proposalVotes[proposalId];
        return (v.againstVotes, v.forVotes, v.abstainVotes);
    }

    /**
     * @notice Returns the start and end block of a proposal's voting window.
     */
    function proposalSnapshot(uint256 proposalId) external view returns (uint256 voteStart, uint256 voteEnd) {
        Proposal storage p = _proposals[proposalId];
        return (p.voteStart, p.voteEnd);
    }

    /**
     * @notice Returns the proposer of a given proposal.
     */
    function proposalProposer(uint256 proposalId) external view returns (address) {
        return _proposals[proposalId].proposer;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal utilities
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Propagates revert data from a low-level call.
    function _verifyCallResult(bool success, bytes memory returndata) internal pure {
        if (!success) {
            if (returndata.length > 0) {
                assembly {
                    revert(add(32, returndata), mload(returndata))
                }
            } else {
                revert("GovernorVulnerable: call reverted without message");
            }
        }
    }

    /// @dev Allow the contract to receive ETH so it can forward value in proposal calls.
    receive() external payable {}
}
