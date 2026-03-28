// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockToken
 * @dev A simple ERC20 token for testing governance attacks
 *      Can be minted and burned by the owner for testing purposes
 *
 * Features:
 * - Standard ERC20 with Permit support for gasless approvals
 * - Flexible minting for test scenarios
 * - Burning capability to adjust supply
 * - Initial supply minting on deployment
 */
contract MockToken is ERC20, ERC20Permit, Ownable {
    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Hard cap on total supply to prevent runaway minting
    uint256 public constant MAX_SUPPLY = 1_000_000_000e18; // 1 billion tokens

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Deploy the mock token with initial supply
     * @param name_ Token name (e.g., "Mock Token")
     * @param symbol_ Token symbol (e.g., "MOCK")
     * @param initialOwner Address that receives initial supply and owns the contract
     * @param initialSupply Initial amount of tokens to mint
     */
    constructor(string memory name_, string memory symbol_, address initialOwner, uint256 initialSupply)
        ERC20(name_, symbol_)
        ERC20Permit(name_)
        Ownable(initialOwner)
    {
        require(initialOwner != address(0), "Invalid owner");
        require(initialSupply <= MAX_SUPPLY, "Initial supply exceeds max supply");

        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
            emit TokensMinted(initialOwner, initialSupply);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Minting Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Mint new tokens (only owner)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @notice Mint tokens to multiple recipients at once
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to mint (must match recipients length)
     */
    function mintMultiple(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Array length mismatch");
        require(recipients.length > 0, "Empty arrays");
        require(recipients.length <= 100, "Too many recipients (max 100)");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Cannot mint to zero address");
            require(amounts[i] > 0, "Amount must be greater than zero");
            totalAmount += amounts[i];
        }

        require(totalSupply() + totalAmount <= MAX_SUPPLY, "Max supply exceeded");

        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
            emit TokensMinted(recipients[i], amounts[i]);
        }
    }

    /**
     * @notice Mint all remaining supply to a single address
     * @param to Recipient address
     * @return amountMinted Amount of tokens minted
     */
    function mintRemainingSupply(address to) external onlyOwner returns (uint256 amountMinted) {
        require(to != address(0), "Cannot mint to zero address");

        amountMinted = MAX_SUPPLY - totalSupply();
        require(amountMinted > 0, "Max supply already reached");

        _mint(to, amountMinted);
        emit TokensMinted(to, amountMinted);

        return amountMinted;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Burning Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Burn tokens from caller's balance
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @notice Burn tokens from a specific address (owner only)
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burnFrom(address from, uint256 amount) external onlyOwner {
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than zero");
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Get remaining supply that can be minted
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }

    /**
     * @notice Check if an amount would exceed max supply if minted
     */
    function canMint(uint256 amount) external view returns (bool) {
        return totalSupply() + amount <= MAX_SUPPLY;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Override functions
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Required by Solidity for ERC20Permit
    function nonces(address owner) public view override(ERC20Permit) returns (uint256) {
        return super.nonces(owner);
    }

    /// @dev Required by Solidity for permit signature
    function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
        public
        override(ERC20Permit)
    {
        super.permit(owner, spender, value, deadline, v, r, s);
    }
}
