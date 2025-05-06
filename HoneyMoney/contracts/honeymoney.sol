// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract HoneyMoney is ERC20 {
    //save owner address
    address public owner;

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
}
