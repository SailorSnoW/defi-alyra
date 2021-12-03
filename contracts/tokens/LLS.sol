pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LLS is ERC20, Ownable {
    address public staking;
    address public masterchief;
    bool private masterchiefSet;
    bool private stakingSet;

    constructor() ERC20("LLStake", "LLS") {}

    function setMasterChefAddress(address _masterchef) external onlyOwner {
        require(masterchiefSet == false, "LLS: already set");
        require(_masterchef != address(0));
        masterchief = _masterchef;
        masterchiefSet = true;
    }

    function setStakingAddress(address _staking) external onlyOwner {
        require(stakingSet == false, "LLS: already set");
        require(_staking != address(0));
        staking = _staking;
        stakingSet = true;
    }

    /** @dev make the token mintable for only masterchief and staking contract */
    function mint(address _account, uint _amount) external {
        require(msg.sender == masterchief, "LLStake: Unauthorized mint");
        _mint(_account, _amount);
    }
}