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
    mapping(address => address) private blackListedAddresses;

    constructor(uint256 initialSupply) ERC20("HoneyMoney", "BEE") {
        owner = msg.sender;
        _mint(owner, initialSupply * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public {
        _burn(from, amount);
    }

    function blacklist(address account) public {
        blackListedAddresses[account] = account;
    }

    function isBlacklisted(address account) public view returns (bool) {
        return blackListedAddresses[account] == account;
    }

    function clearBlacklist(address account) public {
        delete blackListedAddresses[account];
    }
}
