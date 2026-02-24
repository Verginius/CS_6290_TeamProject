// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/**
 * @title GovernanceToken
 * @dev ERC20 governance token that underpins both GovernorBase (secure) and
 *      GovernorVulnerable (intentionally broken) in this research project.
 *
 * ============================================================
 * ROLE IN THE GOVERNANCE SYSTEM
 * ============================================================
 *
 * 1. Vote weight  — token holders accumulate delegated vote weight via
 *    OpenZeppelin's ERC20Votes checkpoint mechanism.  Calling delegate()
 *    or selfDelegate() activates on-chain vote checkpoints.
 *
 * 2. Snapshot safety  — ERC20Votes records historical checkpoints so that
 *    a secure governor can call getPastVotes(account, blockNumber) and get
 *    the weight that existed at proposal-creation time, preventing flash-loan
 *    attacks.  GovernorVulnerable intentionally ignores this (VULN-1).
 *
 * 3. Supply cap  — MAX_SUPPLY (1 billion tokens) is enforced on both mint()
 *    and the constructor to bound total voting power.
 *
 * ============================================================
 * INHERITANCE STACK
 * ============================================================
 *
 * GovernanceToken
 *   └─ ERC20Votes      (checkpoint-based voting power)
 *       └─ ERC20Permit (EIP-2612 gasless approvals)
 *           └─ ERC20   (standard token)
 *   └─ Ownable         (mint access control)
 *   └─ Nonces          (shared nonce store for Permit)
 *
 * ============================================================
 */
contract GovernanceToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Hard cap on the total token supply.
    uint256 public constant MAX_SUPPLY = 1_000_000_000e18;

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Deploys the token, minting `initialSupply` to `initialOwner`.
    /// @param name_         Token name.
    /// @param symbol_       Token symbol.
    /// @param initialOwner  Receives the initial supply and contract ownership.
    /// @param initialSupply Amount of tokens minted at construction.
    constructor(string memory name_, string memory symbol_, address initialOwner, uint256 initialSupply)
        ERC20(name_, symbol_)
        ERC20Permit(name_)
        Ownable(initialOwner)
    {
        require(initialOwner != address(0), "invalid owner");
        require(initialSupply <= MAX_SUPPLY, "max supply exceeded");

        _mint(initialOwner, initialSupply);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Owner actions
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Mints `amount` tokens to `to`.  Only callable by the owner.
    /// @param to     Recipient of the newly minted tokens.
    /// @param amount Number of tokens to mint.
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "max supply exceeded");
        _mint(to, amount);
    }

    /// @notice Convenience wrapper — delegates the caller's votes to themselves.
    function selfDelegate() external {
        _delegate(msg.sender, msg.sender);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Overrides
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Required by ERC20 and ERC20Votes to update vote balances on transfers.
    /// @param from  Address whose balance decreases.
    /// @param to    Address whose balance increases.
    /// @param value Amount transferred.
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    /// @dev Required by ERC20Permit and Nonces.
    /// @param owner Address whose nonce is queried.
    /// @return      Current nonce for `owner`.
    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
