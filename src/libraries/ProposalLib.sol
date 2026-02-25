// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  ProposalLib
 * @author CS 6290 Team — Student 1 (Spec, Architecture & Core Governance Lead)
 * @notice Utility library covering the full proposal lifecycle: deterministic
 *         ID derivation, calldata integrity validation, description hashing,
 *         array-length guards, and lifecycle-state helpers.
 *
 * @dev    Designed for use by GovernorVulnerable, GovernorWithDefenses, and
 *         any future governor variant.  All functions are `internal pure` or
 *         `internal view` — no storage reads outside of the helpers that
 *         accept storage pointers explicitly.
 *
 * ============================================================
 * PROPOSAL ID SCHEME
 * ============================================================
 *
 * A proposal is uniquely identified by the keccak256 hash of its *content*:
 *
 *   proposalId = uint256(keccak256(abi.encode(
 *       targets[], values[], calldatas[], descriptionHash
 *   )))
 *
 * This mirrors OpenZeppelin's Governor and ensures that two proposals with
 * identical actions and descriptions produce the same ID — preventing
 * duplicate submissions.
 *
 * ============================================================
 * CALLDATA INTEGRITY (FIX-8)
 * ============================================================
 *
 * `validateCalldata` verifies that the arrays supplied by the caller at
 * execution time are identical — element-by-element — to those stored at
 * proposal creation.  This prevents the VULN-8 attack where a malicious
 * actor passes different `targets` / `calldatas` to `execute()`.
 *
 * ============================================================
 * ARRAY VALIDATION
 * ============================================================
 *
 * `validateArrayLengths` enforces that `targets`, `values`, and `calldatas`
 * are all the same length and non-empty before a proposal is stored.
 *
 * ============================================================
 */
library ProposalLib {
    // ─────────────────────────────────────────────────────────────────────────
    // § 1  Proposal ID
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Derives a deterministic proposal ID from its content.
     *
     * @dev    ID = uint256(keccak256(abi.encode(targets, values, calldatas, descriptionHash)))
     *
     *         Identical to OpenZeppelin's Governor.hashProposal to ensure
     *         cross-contract compatibility.
     *
     * @param  targets         Contract addresses to call on execution.
     * @param  values          ETH values forwarded to each call.
     * @param  calldatas       ABI-encoded call data for each target.
     * @param  descriptionHash keccak256 of the proposal description string.
     * @return proposalId      Deterministic uint256 identifier.
     */
    function hashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal pure returns (uint256 proposalId) {
        return uint256(keccak256(abi.encode(targets, values, calldatas, descriptionHash)));
    }

    /**
     * @notice Computes the keccak256 hash of a UTF-8 description string.
     *
     * @dev    Used to convert the human-readable description into the compact
     *         `bytes32 descriptionHash` stored in the Proposal struct.
     *         Assembly version avoids an extra memory allocation.
     *
     * @param  description  Plain-text proposal description.
     * @return hash         keccak256 hash of the description.
     */
    function hashDescription(string memory description) internal pure returns (bytes32 hash) {
        assembly ("memory-safe") {
            hash := keccak256(add(description, 0x20), mload(description))
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // § 2  Array validation
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Validates that `targets`, `values`, and `calldatas` are the same
     *         length and contain at least one element.
     *
     * @dev    Call this inside `propose()` before writing any storage.
     *         Reverts with a descriptive message on any violation.
     *
     * @param  targets    Targets array.
     * @param  values     Values array.
     * @param  calldatas  Calldatas array.
     */
    function validateArrayLengths(address[] memory targets, uint256[] memory values, bytes[] memory calldatas)
        internal
        pure
    {
        require(targets.length > 0, "ProposalLib: empty proposal");
        require(targets.length == values.length, "ProposalLib: targets/values length mismatch");
        require(targets.length == calldatas.length, "ProposalLib: targets/calldatas length mismatch");
    }

    /**
     * @notice Validates that caller-supplied arrays at execution time are
     *         identical — element-by-element — to those stored at proposal
     *         creation.  Implements FIX-8.
     *
     * @dev    Checks that each stored element is identical to the supplied
     *         element.  For `calldatas`, uses `keccak256` comparison to avoid
     *         looping over potentially large byte arrays.
     *
     *         Reverts on any discrepancy.
     *
     * @param  storedTargets    Targets stored at `propose()` time.
     * @param  storedValues     Values stored at `propose()` time.
     * @param  storedCalldatas  Calldatas stored at `propose()` time.
     * @param  suppliedTargets  Targets supplied by the caller at `execute()`.
     * @param  suppliedValues   Values supplied by the caller at `execute()`.
     * @param  suppliedCalldatas Calldatas supplied by the caller at `execute()`.
     */
    function validateCalldata(
        address[] memory storedTargets,
        uint256[] memory storedValues,
        bytes[] memory storedCalldatas,
        address[] memory suppliedTargets,
        uint256[] memory suppliedValues,
        bytes[] memory suppliedCalldatas
    ) internal pure {
        require(suppliedTargets.length == storedTargets.length, "ProposalLib: targets length mismatch");
        require(suppliedValues.length == storedValues.length, "ProposalLib: values length mismatch");
        require(suppliedCalldatas.length == storedCalldatas.length, "ProposalLib: calldatas length mismatch");

        for (uint256 i = 0; i < storedTargets.length; ++i) {
            require(suppliedTargets[i] == storedTargets[i], "ProposalLib: target mismatch");
            require(suppliedValues[i] == storedValues[i], "ProposalLib: value mismatch");
            require(keccak256(suppliedCalldatas[i]) == keccak256(storedCalldatas[i]), "ProposalLib: calldata mismatch");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // § 3  Voting-window helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the block at which voting starts for a proposal.
     *
     * @param  creationBlock  Block at which `propose()` was called.
     * @param  votingDelay    Delay in blocks between creation and voting start.
     * @return voteStart      First block (inclusive) where votes may be cast.
     */
    function voteStartBlock(uint256 creationBlock, uint256 votingDelay) internal pure returns (uint256 voteStart) {
        return creationBlock + votingDelay;
    }

    /**
     * @notice Returns the last block (inclusive) of the voting window.
     *
     * @param  voteStart    First block of the voting window.
     * @param  votingPeriod Length of the voting window in blocks.
     * @return voteEnd      Last block (inclusive) where votes may be cast.
     */
    function voteEndBlock(uint256 voteStart, uint256 votingPeriod) internal pure returns (uint256 voteEnd) {
        return voteStart + votingPeriod;
    }

    /**
     * @notice Returns `true` if the current block is within the voting window.
     *
     * @param  voteStart  First block of the voting window.
     * @param  voteEnd    Last block of the voting window.
     * @return            `true` if voting is currently active.
     */
    function isVotingActive(uint256 voteStart, uint256 voteEnd) internal view returns (bool) {
        return block.number >= voteStart && block.number <= voteEnd;
    }

    /**
     * @notice Returns `true` if the current block is before the voting window
     *         (proposal is still pending).
     *
     * @param  voteStart  First block of the voting window.
     * @return            `true` if the proposal is pending.
     */
    function isPending(uint256 voteStart) internal view returns (bool) {
        return block.number < voteStart;
    }

    /**
     * @notice Returns `true` if the voting window has fully closed.
     *
     * @param  voteEnd  Last block of the voting window.
     * @return          `true` if voting has ended.
     */
    function isVotingEnded(uint256 voteEnd) internal view returns (bool) {
        return block.number > voteEnd;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // § 4  Timelock / expiry helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the ETA (earliest execution timestamp) for a proposal
     *         queued in a `TimelockController`.
     *
     * @param  queuedAt   `block.timestamp` at which the proposal was queued.
     * @param  timelockDelay  Minimum delay enforced by the timelock (seconds).
     * @return eta        UNIX timestamp at which the proposal can be executed.
     */
    function computeEta(uint256 queuedAt, uint256 timelockDelay) internal pure returns (uint256 eta) {
        return queuedAt + timelockDelay;
    }

    /**
     * @notice Returns `true` if the proposal's grace period has elapsed,
     *         meaning it should be considered `Expired`.
     *
     * @param  eta          ETA timestamp set when the proposal was queued.
     * @param  gracePeriod  Maximum seconds after ETA before expiry.
     * @return              `true` if the proposal has expired.
     */
    function isExpired(uint256 eta, uint256 gracePeriod) internal view returns (bool) {
        return block.timestamp >= eta + gracePeriod;
    }

    /**
     * @notice Returns `true` if the timelock delay has elapsed and the proposal
     *         is ready for execution.
     *
     * @param  eta  ETA timestamp set when the proposal was queued.
     * @return      `true` if the current timestamp is at or past the ETA.
     */
    function isReady(uint256 eta) internal view returns (bool) {
        return block.timestamp >= eta;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // § 5  Calldata / value forwarding utility
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Executes a batch of low-level calls encoded in a proposal and
     *         propagates any revert reason.
     *
     * @dev    Does NOT check for reentrancy — the caller is responsible for
     *         applying the CEI pattern (state writes before calling this
     *         function — FIX-6).
     *
     *         Used by test helpers and simulation scripts; production governor
     *         contracts should delegate execution to `TimelockController` for
     *         mandatory delay enforcement.
     *
     * @param  targets    Addresses to call.
     * @param  values     ETH values forwarded to each call.
     * @param  calldatas  ABI-encoded call data.
     */
    function executeBatch(address[] memory targets, uint256[] memory values, bytes[] memory calldatas) internal {
        for (uint256 i = 0; i < targets.length; ++i) {
            (bool success, bytes memory returndata) = targets[i].call{value: values[i]}(calldatas[i]);
            _propagateRevert(success, returndata);
        }
    }

    /**
     * @dev Propagates the revert reason from a low-level call.
     *      If the call succeeded, does nothing.
     */
    function _propagateRevert(bool success, bytes memory returndata) private pure {
        if (!success) {
            if (returndata.length > 0) {
                assembly {
                    revert(add(32, returndata), mload(returndata))
                }
            } else {
                revert("ProposalLib: call reverted without message");
            }
        }
    }
}
