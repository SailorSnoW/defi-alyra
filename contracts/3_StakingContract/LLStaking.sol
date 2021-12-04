pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LLStaking is ERC20 {

    IERC20 public lls;

    uint private lastMint;

    constructor(address _lls) ERC20("staked LLS", "stkLLS") {
        lls = IERC20(_lls);
    }

    function stakeAll() external {
        stake(lls.balanceOf(msg.sender));
    }

    function stake(uint _amount) public {
        require(_amount > 0, "LLStaking: null amount");
        lls.transferFrom(msg.sender, address(this), _amount);
        uint shares;
        if (totalSupply() == 0){
            shares = _amount;
        }
        else {
            shares = _amount * (totalSupply() / lls.balanceOf(address(this)));
        }
        _mint(msg.sender, shares);
    }

    function unstakeAll() external {
        unstake(balanceOf(msg.sender));
    }

    function unstake(uint _shares) public {
        require(_shares > 0, "LLStaking: null shares");
        uint amount = _shares / (totalSupply() * lls.balanceOf(address(this)));
        _burn(msg.sender, _shares); 
        lls.transfer(msg.sender, amount);
    }

    function mintLLS() external {
        uint timeCheck = block.timestamp - lastMint;
        require(timeCheck >= 3600, "LLStaking: should wait for new mint");
        (bool success, bytes memory data) = address(lls).call(abi.encodeWithSignature("mint(address,uint)", address(this), 10*(10**18)));
        require(success = true || data.length == 0, "LLstaking: can't mint new LLS");
    }
}