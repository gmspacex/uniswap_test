// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WETH is ERC20 {
    using SafeMath for uint256;
    address public minter;

    uint256 cap = 100;
    uint256 total_supply = cap.mul(10**18);

    event MinterChanged(address indexed from, address to);

    constructor() public payable ERC20("ChonMarsWrappedETH", "CWETH") {
        minter = msg.sender; //only initially
        mint(msg.sender, total_supply);
    }

    function mint(address account, uint256 amount) public {
        require(
            msg.sender == minter,
            "Error, msg.sender does not have minter role"
        ); //dBank
        _mint(account, amount);
    }
}
