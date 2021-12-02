pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract fUSDT is ERC20 {
    constructor() ERC20("fake Tether USD", "fUSDT") {}

    /** @dev make the token mintable without any restriction */
    function mint(address _account, uint _amount) external {
        _mint(_account, _amount);
    }
}