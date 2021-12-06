const { hre, ethers } = require("hardhat");
const { expect } = require("chai");
const { BigNumber } = ethers;

describe("UniswapV2 Fork", function () {
    const pairArtifact = require("../artifacts/contracts/1_UniswapV2Forked/LLSwapPair.sol/LLSwapPair.json");
    const pair_abi = pairArtifact.abi;

    // accounts
    let feeToSetter;
    let provider1;
    let userSwap1;

    // deployed contracts
    let factory;
    let router;
    let weth;
    let fusdt;
    let fdai;

    // deployed pairs
    let fusdt_weth;

    before(async function () {
        const accounts = await ethers.getSigners();
        feeToSetter = accounts[1];
        provider1 = accounts[2];
        provider2 = accounts[3];
        provider3 = accounts[4];
        userSwap1 = accounts[5];
    })

    context("Contracts deployment", () => {
        // don't need any before(), state 0

        it("should deploy factory contract", async () => {
            const LLSwapFactory = await ethers.getContractFactory("LLSwapFactory");
            factory = await LLSwapFactory.deploy(feeToSetter.address);
    
            expect(factory.address).to.be.properAddress; //properAddress verify if it's a correct Ethereum address format
        })

        it("should deploy WETH contract", async () => {
            const WETH = await ethers.getContractFactory("WETH");
            weth = await WETH.deploy();

            expect(weth.address).to.be.properAddress;
        })
        it("should deploy router contract", async () => {
            const LLSwapRouter02 = await ethers.getContractFactory("LLSwapRouter02");
            router = await LLSwapRouter02.deploy(factory.address, weth.address);

            expect(router.address).to.be.properAddress;
            
            const factoryAddressSet = await router.factory.call();
            const wethAddressSet = await router.WETH.call();

            expect(factoryAddressSet).to.be.equal(factory.address);
            expect(wethAddressSet).to.be.equal(weth.address);
        })
    })

    context("fake Tokens deployment", () => {
        // don't need any before(), as we don't use uniswap deployed contract at the moment

        it("should deploy fUSDT contract", async () => {
            const fUSDT = await ethers.getContractFactory("fUSDT");
            fusdt = await fUSDT.deploy();

            expect(fusdt.address).to.be.properAddress;
        })
        it("should deploy fDAI contract", async () => {
            const fDAI = await ethers.getContractFactory("fDAI");
            fdai = await fDAI.deploy();

            expect(fdai.address).to.be.properAddress;
        })
    })

    context("Creating pairs", () => {
        it("should create the fUSDT/WETH pair", async () => {
            const tx = await factory.createPair(fusdt.address, weth.address);
            const receipt = await tx.wait();

            const token0Address = receipt.events[0].args[0];
            const token1Address = receipt.events[0].args[1];
            const pairAddress = receipt.events[0].args[2];

            expect(token0Address).to.be.oneOf([fusdt.address, weth.address]);
            expect(token1Address).to.be.oneOf([fusdt.address, weth.address]);
            expect(pairAddress).to.be.properAddress;

            // assign contract to interact with after verified
            fusdt_weth = new ethers.Contract(
                pairAddress,
                pair_abi,
                ethers.provider
            )
        })
        it("should create the fDAI/WETH pair", async () => {
            const tx = await factory.createPair(fdai.address, weth.address);
            const receipt = await tx.wait();

            const token0Address = receipt.events[0].args[0];
            const token1Address = receipt.events[0].args[1];
            const pairAddress = receipt.events[0].args[2];

            expect(token0Address).to.be.oneOf([fdai.address, weth.address]);
            expect(token1Address).to.be.oneOf([fdai.address, weth.address]);
            expect(pairAddress).to.be.properAddress;

            // assign contract to interact with after verified
            fdai_weth = new ethers.Contract(
                pairAddress,
                pair_abi,
                ethers.provider
            )
        })
    })

    context("Adding liquidity in a pair", () => {
        before(async () => {
            // mint fake tokens to accounts
            const amountToMint = ethers.utils.parseEther("100");

            await fusdt.mint(provider1.address, amountToMint);
        })

        it("should add liquidity into fUSDT/WETH pool", async () => {
            // pre-check if liquidity never added in pool
            let currentPoolLiquidity = await fusdt_weth.getReserves();
            let reserve1 = ethers.utils.formatEther(currentPoolLiquidity[0]);
            let reserve2 = ethers.utils.formatEther(currentPoolLiquidity[1]);
            let lastLiquidityAdd = currentPoolLiquidity[2];

            expect(reserve1).to.be.equal('0.0');
            expect(reserve2).to.be.equal('0.0');
            expect(lastLiquidityAdd).to.be.equal(0);


            const desiredAmount = ethers.utils.parseEther("100");
            
            // approving Router to transfer fUSDT
            await fusdt.connect(provider1).approve(router.address, desiredAmount);

            // adding liquidity
            const tx = await router
                .connect(provider1)
                    .addLiquidityETH(
                        fusdt.address,
                        desiredAmount,
                        0,
                        0,
                        provider1.address,
                        1838497206,
                        {value: desiredAmount}
                    );
            const receipt = await tx.wait();
            
            // post-check, if liquidity got added in pool
            currentPoolLiquidity = await fusdt_weth.getReserves();
            reserve1 = ethers.utils.formatEther(currentPoolLiquidity[0]);
            reserve2 = ethers.utils.formatEther(currentPoolLiquidity[1]);
            lastLiquidityAdd = currentPoolLiquidity[2];

            const txBlock = await ethers.provider.getBlock(receipt.blockNumber);

            expect(reserve1).to.be.equal(ethers.utils.formatEther(desiredAmount));
            expect(reserve2).to.be.equal(ethers.utils.formatEther(desiredAmount));
            expect(lastLiquidityAdd).to.be.equal(txBlock.timestamp)
        })
    })

    context("Swapping", () => {

        // single path swap testing
        it("should swap ETH for fUSDT", async () => {
            // pre-check
            let fUSDTUserBalance = await fusdt.balanceOf(userSwap1.address);
            const ETHUserBalance = await ethers.provider.getBalance(userSwap1.address);
            expect(parseInt(ethers.utils.formatEther(ETHUserBalance))).to.be.greaterThanOrEqual(100);
            expect(ethers.utils.formatEther(fUSDTUserBalance)).to.be.equal('0.0');

            // swapping ethers for fUSDT's
            const ETHToSwap = ethers.utils.parseEther("50");
            const fUSDTAmountDesired = ethers.utils.parseEther("30");

            const tx = await router
                .connect(userSwap1)
                    .swapExactETHForTokens(
                        fUSDTAmountDesired,
                        [weth.address, fusdt.address],
                        userSwap1.address,
                        1838497206,
                        {value: ETHToSwap}
                    )
            await tx.wait();

            // post-check
            fUSDTUserBalance = await fusdt.balanceOf(userSwap1.address);
            const NewETHUserBalance = await ethers.provider.getBalance(userSwap1.address);
            expect(parseInt(ethers.utils.formatEther(NewETHUserBalance)))
                .to.be.lessThanOrEqual( //testing less or equal because network fees
                    parseInt(ethers.utils.formatEther(ETHUserBalance)) - parseInt(ethers.utils.formatEther(ETHToSwap))
                    );
            expect(parseInt(ethers.utils.formatEther(fUSDTUserBalance))).to.be.greaterThan(0);
        })

        before(async () => {
            const amount = ethers.utils.parseEther("100");

            await fdai.mint(provider1.address, amount);
            await fdai.connect(provider1).approve(router.address, amount);
            await router
                .connect(provider1)
                    .addLiquidityETH(
                        fdai.address,
                        amount,
                        0,
                        0,
                        provider1.address,
                        1838497206,
                        {value: amount}
                    );  
        })

        // multi path swap testing
        it("should swap fUSDT for fDAI", async () => {
            // pre-check
            let fDAIUserBalance = await fdai.balanceOf(userSwap1.address);
            let fUSDTUserBalance = await fusdt.balanceOf(userSwap1.address);
            fUSDTUserBalance = parseInt(ethers.utils.formatEther(fUSDTUserBalance));
            fDAIUserBalance = parseInt(ethers.utils.formatEther(fDAIUserBalance));
            expect(fUSDTUserBalance).to.be.greaterThan(0);
            expect(fDAIUserBalance).to.be.equal(0);

            // swapping ethers for fUSDT's
            const fDAIAMountDesired = ethers.utils.parseEther("30");
            const fUSDTAmountIn = ethers.utils.parseEther("30");

            // approving to transfer fUSDT
            await fusdt.connect(userSwap1).approve(router.address, fUSDTAmountIn);

            const tx = await router
                .connect(userSwap1)
                    .swapExactTokensForTokens(
                        fUSDTAmountIn,
                        fDAIAMountDesired,
                        [fusdt.address, weth.address, fdai.address],
                        userSwap1.address,
                        1838497206,
                    )
            await tx.wait();
            
            // post-check
            let newfUSDTUserBalance = await fusdt.balanceOf(userSwap1.address);
            let newfDAIUserBalance = await fdai.balanceOf(userSwap1.address);
            newfUSDTUserBalance = parseInt(ethers.utils.formatEther(newfUSDTUserBalance));
            newfDAIUserBalance = parseInt(ethers.utils.formatEther(newfDAIUserBalance));
            expect(newfUSDTUserBalance).to.be.lessThanOrEqual(fUSDTUserBalance - parseInt(ethers.utils.formatEther(fUSDTAmountIn)));
            expect(newfDAIUserBalance).to.be.greaterThanOrEqual(parseInt(ethers.utils.formatEther(fDAIAMountDesired)));
        })
    })
})