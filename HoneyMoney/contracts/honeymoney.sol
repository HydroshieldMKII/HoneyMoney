// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
//balanceOf()
//transfer()
//symbol()
//name()

contract HoneyMoney is ERC20 {
    //save owner address
    address public owner;
    bool public paused = false;
    mapping(address => address[]) private blackListedAddresses;

    modifier adminOnly() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(uint256 initialSupply) ERC20("HoneyMoney", "BEE") {
        owner = msg.sender;
        _mint(owner, initialSupply * 10 ** decimals());
    }

    function togglePause() public adminOnly {
        paused = !paused;
    }

    // Override transfer function to include blacklist check
    function transfer(address recipient, uint256 amount) public override returns (bool) {
        require(!paused, "Contract is paused");
        require(!isBlacklisted(msg.sender), "Sender is blacklisted");
        require(!isBlacklisted(recipient), "Recipient is blacklisted");
        return super.transfer(recipient, amount);
    }

    function mint(address to, uint256 amount) public {
        require(!paused, "Contract is paused");
        require(!isBlacklisted(to), "Cannot mint to a blacklisted address");
        _mint(to, amount);
    }

    // Burn tokens from a specific address
    function burn(address from, uint256 amount) public adminOnly {
        require(!paused, "Contract is paused");
        require(!isBlacklisted(from), "Cannot burn from a blacklisted address");
        _burn(from, amount);
    }

    // Blacklist an address for the caller
    function blacklist(address account, bool enabled) public {
        require(!paused, "Contract is paused");
        require(!isBlacklisted(account), "Address is already blacklisted");

        if (!enabled) {
            address[] storage blacklisted = blackListedAddresses[msg.sender];
            for (uint i = 0; i < blacklisted.length; i++) {
                if (blacklisted[i] == account) {
                    delete blacklisted[i];
                    break;
                }
            }
        }else{
            blackListedAddresses[msg.sender].push(account);
        }
    }

    // Check if an address is blacklisted for the caller
    function isBlacklisted(address account) public view returns (bool) {
        address[] memory blacklisted = blackListedAddresses[msg.sender];
        for (uint i = 0; i < blacklisted.length; i++) {
            if (blacklisted[i] == account) {
                return true;
            }
        }
        return false;
    }

    // Clear the blacklist for the caller
    function clearBlacklist() public {
        require(!paused, "Contract is paused");
        delete blackListedAddresses[msg.sender];
    }
}
