const { hre, ethers } = require("hardhat");
const { expect } = require("chai");
const { BigNumber } = ethers;

describe("SushiSwap Fork", function () {
    const pairArtifact = require("../artifacts/contracts/1_UniswapV2Forked/LLSwapPair.sol/LLSwapPair.json");
    const pair_abi = pairArtifact.abi;

    // accounts
    let feeToSetter;
    let dev;

    // deployed contracts
    let factory;
    let router;
    let weth;
    let fusdt;
    let fusdc;
    let fdai;
    let lls;
    let masterchef;

    // initial state: contracts are deployed, pairs are created
    before(async () => {
        const accounts = await ethers.getSigners();
        feeToSetter = accounts[1];
        dev = accounts[6];

        const LLSwapFactory = await ethers.getContractFactory("LLSwapFactory");
        const WETH = await ethers.getContractFactory("WETH");
        const LLSwapRouter02 = await ethers.getContractFactory("LLSwapRouter02");
        const fUSDT = await ethers.getContractFactory("fUSDT");
        const fUSDC = await ethers.getContractFactory("fUSDC");
        const fDAI = await ethers.getContractFactory("fDAI");

        factory = await LLSwapFactory.deploy(feeToSetter.address);
        weth = await WETH.deploy();
        router = await LLSwapRouter02.deploy(factory.address, weth.address);
        
        fusdt = await fUSDT.deploy();
        fusdc = await fUSDC.deploy();
        fdai = await fDAI.deploy();


        let tx = await factory.createPair(fusdt.address, weth.address);
        let receipt = await tx.wait();
        fusdt_weth = new ethers.Contract(
            receipt.events[0].args[2],
            pair_abi,
            ethers.provider
        )
        tx = await factory.createPair(fusdc.address, weth.address);
        receipt = await tx.wait();
        fusdc_weth = new ethers.Contract(
            receipt.events[0].args[2],
            pair_abi,
            ethers.provider
        )
        tx = await factory.createPair(fdai.address, weth.address);
        receipt = await tx.wait();
        fdai_weth = new ethers.Contract(
            receipt.events[0].args[2],
            pair_abi,
            ethers.provider
        )
    })

    context("Contract deployment", () => {
        it("should deploy LLS token contract", async () => {
            const LLS = await ethers.getContractFactory("LLS");
            lls = await LLS.deploy();

            expect(lls.address).to.be.properAddress;
        })
        it("should deploy MasterChef contract", async () => {
            const llsPerBlock = ethers.utils.parseEther("2");
            const actualBlock = await ethers.provider.getBlockNumber()
            const MasterChef = await ethers.getContractFactory("LLMasterChef");
            masterchef = await MasterChef.deploy(
                lls.address,
                dev.address,
                llsPerBlock,
                actualBlock + 1,
                actualBlock + 100
            );

            expect(masterchef.address).to.be.properAddress;
        })

        after(async () => {
            await lls.setMasterChefAddress(masterchef.address);
        })
    })

    context("Adding Pools", () => {
        it("should add the fUSDT/WETH pool (20% ratio)", async () => {
            const poolLength = await masterchef.poolLength();
            expect(poolLength).to.be.equal(BigNumber.from(0));

            await masterchef.add(
                20,
                fusdt_weth.address,
                true
              )
            
            const newPoolLength = await masterchef.poolLength();
            expect(newPoolLength).to.be.equal(BigNumber.from(1));
        })
        it("should add the fUSDC/WETH pool (30% ratio)", async () => {
            const poolLength = await masterchef.poolLength();
            expect(poolLength).to.be.equal(BigNumber.from(1));

            await masterchef.add(
                30,
                fusdc_weth.address,
                true
              )
            
            const newPoolLength = await masterchef.poolLength();
            expect(newPoolLength).to.be.equal(BigNumber.from(2));
        })
        it("should add the fDAI/WETH pool (50% ratio)", async () => {
            const poolLength = await masterchef.poolLength();
            expect(poolLength).to.be.equal(BigNumber.from(2));

            await masterchef.add(
                50,
                fdai_weth.address,
                true
              )
            
            const newPoolLength = await masterchef.poolLength();
            expect(newPoolLength).to.be.equal(BigNumber.from(3));
        })
    })
})