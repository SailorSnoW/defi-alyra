pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LLStaking is ERC20 {

    /** @notice the staking token */
    IERC20 public lls;

    /** @dev timestamp of last mint */
    uint private lastMint;

    event onDeposit(uint _amountLLS, uint _amountShares, address _from);
    event onWithdraw(uint _amountShares, uint _amountLLS, address _to);

    constructor(address _lls) ERC20("staked LLS", "stkLLS") {
        lls = IERC20(_lls);
    }

    function stakeAll() external {
        stake(lls.balanceOf(msg.sender));
    }

    /**
        @notice transfer LLS on this contract and give freshly created stkLLS in exchange 
        @dev stkLLS represents shares 
    */
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
        emit onDeposit(_amount, shares, msg.sender);
    }

    function unstakeAll() external {
        unstake(balanceOf(msg.sender));
    }

    /**
        @notice burn stkLLS and give back LLS depending on burned shares
    */
    function unstake(uint _shares) public {
        require(_shares > 0, "LLStaking: null shares");
        uint amount = _shares / (totalSupply() * lls.balanceOf(address(this)));
        _burn(msg.sender, _shares); 
        lls.transfer(msg.sender, amount);
        emit onWithdraw(_shares, amount, msg.sender);
    }

    /** @notice mint some LLS rewards */
    function mintLLS() public {
        uint timeCheck = block.timestamp - lastMint;
        require(timeCheck >= 3600, "LLStaking: should wait for new mint");
        lastMint = block.timestamp;
        (bool success, bytes memory data) = address(lls).call(abi.encodeWithSignature("_mint(address,uint)", address(this), 10*(10**18)));
        require(success = true || data.length == 0, "LLstaking: can't mint new LLS");
    }
}