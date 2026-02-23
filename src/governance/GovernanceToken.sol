// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

contract GovernanceToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000e18;

    /**
     * @dev Sets up the governance token with a name, symbol, initial owner, and initial supply.
     * @param name_ The name of the token.
     * @param symbol_ The symbol of the token.
     * @param initialOwner The address that will own the initial supply and the contract.
     * @param initialSupply The amount of tokens to mint to the initial owner.
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address initialOwner,
        uint256 initialSupply
    ) ERC20(name_, symbol_) ERC20Permit(name_) Ownable(initialOwner) {
        require(initialOwner != address(0), "invalid owner");
        require(initialSupply <= MAX_SUPPLY, "max supply exceeded");

        _mint(initialOwner, initialSupply);
    }

    /**
     * @dev Mints new tokens to a specified address. Only callable by the owner.
     * @param to The address to mint tokens to.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "max supply exceeded");
        _mint(to, amount);
    }

    /**
     * @dev Delegates votes from the sender to themselves.
     * This is a helper function to easily enable voting power for the token holder.
     */
    function selfDelegate() external {
        _delegate(msg.sender, msg.sender);
    }

    /**
     * @dev Overrides the _update function to handle vote transfers.
     * Required by ERC20Votes.
     * @param from The address modifying the balance.
     * @param to The address receiving the balance.
     * @param value The amount of tokens being transferred.
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    /**
     * @dev Overrides the nonces function.
     * Required by ERC20Permit and Nonces.
     * @param owner The address to check the nonce for.
     * @return The current nonce for the address.
     */
    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}