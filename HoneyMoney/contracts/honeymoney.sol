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

    function getOwner() public view returns (address) {
        return owner;
    }

    function getBlacklistedAddresses() public view returns (address[] memory) {
        return blackListedAddresses[msg.sender];
    }
    
    function isPaused() public view returns (bool) {
        return paused;
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

        if (!enabled) {
            require(isBlacklisted(account), "Address is not blacklisted");
            for (uint i = 0; i < blackListedAddresses[msg.sender].length; i++) {
                if (blackListedAddresses[msg.sender][i] == account) {
                    // Move the last element to the deleted spot
                    blackListedAddresses[msg.sender][i] = blackListedAddresses[msg.sender][blackListedAddresses[msg.sender].length - 1];
                    blackListedAddresses[msg.sender].pop();
                    break;
                }
            }
        }
        else{
            require(!isBlacklisted(account), "Address is already blacklisted");
            blackListedAddresses[msg.sender].push(account);
        }
    }

    // Check if an address is blacklisted for the caller
    function isBlacklisted(address account) public view returns (bool) {
        address[] storage blacklist = blackListedAddresses[msg.sender];
        for (uint i = 0; i < blacklist.length; i++) {
            if (blacklist[i] == account) {
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
