# Défi 4 - Alyra (DeFi)

Using hardhat for easier debugging with the hardhat console.

Forked contracts from UniswapV2 are updated to 0.8.10 and don't use SafeMath anymore.
Forked contract from SushiSwap is updated to 0.8.10 but now use OpenZeppelin SafeMath for >0.8 instead of the old SafeMath.

Tests are also available in *`test`* folder and divided in multiple files, depending on the part.
Tests are just testing things in the scope of the exercise and aim to be minimals.

The excercise is divided in 3 different part.

## :unicorn: 1) Fork UniswapV2

Main UniswapV2 forked contracts (doesn't include interfaces/libraries)

[*`UniswapV2Pair.sol`*](https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Pair.sol)

[*`UniswapV2ERC20.sol`*](https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2ERC20.sol)

[*`UniswapV2Factory.sol`*](https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Factory.sol)

[*`UniswapV2Router02.sol`*](https://github.com/Uniswap/v2-periphery/blob/master/contracts/UniswapV2Router02.sol)

&nbsp;
Forked contracts are situed in

##### *`contracts/1_UniswapV2Forked/`*

- *`LLSwapPair.sol`*

- *`LLSwapERC20.sol`*

- *`LLSwapFactory.sol`*

- *`LLSwapRouter.sol`*

&nbsp;

## :sushi: 2) Fork SushiSwap

As asked, only one SushiSwap contract got forked

[*`MasterChef.sol`*](https://github.com/sushiswap/sushiswap/blob/canary/contracts/MasterChef.sol)
&nbsp;
Forked contracts are situed in

##### *`contracts/2_SushiSwapForked`*

- *`LLMasterChef.sol`*

&nbsp;

## :dollar: 3) Staking

The staking contract rewards user staking *LLS* tokens in the contract.
When the user deposit *LLS* tokens, this contract give to the user *stkLLS,* which represent shares of the deposited *LLS*.

Gived shares are determined with the following compute:
`LLS deposit amount` * (`supply of all gived stkLLS` / `LLS staked in the contract`)

New *LLS* can be minted by this contract every hour. These minted LLS are the rewards which users can withdraw with the previously deposited *LLS* tokens

User can withdraw their staked *LLS* by burning the *stkLLS*.

Received *LLS* are determined with the following compute:
`stkLLS burned amount` / (`supply of all gived stkLLS` * `LLS staked in the contract`)
&nbsp;

Staking contract are situed at

##### *`contracts/3_Staking/LLStaking.sol`*

&nbsp;

## Tokens

#### *`LLStake (LLS)`* 

*LLS* is the token used by the *MasterChef* and *Staking* contracts to reward stakers and liquidity providers.

contract of *LLS* token is situed at

##### *`contracts/2_SushiSwapForked/tokens/LLS.sol`*
&nbsp;
#### *`staked LLStake (stkLLS)`* 

*stkLLS* is the token given in return when staking *LLS*. They represent the shares of the staking contract.
&nbsp;

#### *`Fake tokens (fUSDT, fUSDC, fDAI)`*

Fake tokens are basic ERC20 tokens which is mintable without any restriction.

:warning: should be used ONLY in a developement and testing purpose.

contracts of fake tokens are situed in:

##### *`contracts/1_UniswapV2Forked/tokens/`*

- *`fUSDT.sol`*

- *`fUSDC.sol`*

- *`fDAI.sol`*
&nbsp;

#### *`Wrapped Ether (WETH)`*

*WETH* is a fork of the actual [WETH9](https://etherscan.io/address/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2) contract.

It wrap Ethers in a ERC20 token.

WETH contract is situed at

##### *`contracts/1_UniswapV2Forked/tokens/WETH.sol`*

&nbsp;

## Gas Informations

### *`Calls cost`*
![Calls cost](./docs/calls_cost.png)
### *`Deployments cost`*
![Deployments cost](./docs/deploy_cost.png)
