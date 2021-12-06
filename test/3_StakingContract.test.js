const { hre, ethers } = require("hardhat");
const { expect } = require("chai");
const { BigNumber } = ethers;

describe("Staking contract", function () {
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
    let staking;
    
    // initial state: contracts are deployed, pairs are created, pools added
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
        const LLS = await ethers.getContractFactory("LLS");
        const MasterChef = await ethers.getContractFactory("LLMasterChef");

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

        
        lls = await LLS.deploy();

        const llsPerBlock = ethers.utils.parseEther("2");
        const actualBlock = await ethers.provider.getBlockNumber()
        masterchef = await MasterChef.deploy(
            lls.address,
            dev.address,
            llsPerBlock,
            actualBlock + 1,
            actualBlock + 100
        );

        await lls.setMasterChefAddress(masterchef.address);

        await masterchef.add(
            20,
            fusdt_weth.address,
            true
          )
        await masterchef.add(
            30,
            fusdc_weth.address,
            true
            )
        await masterchef.add(
            50,
            fdai_weth.address,
            true
          )
    })

    context("Contract deployment", () => {
        it("should deploy Staking contract", async () => {
            const Staking = await ethers.getContractFactory("LLStaking");
            staking = await Staking.deploy(lls.address);

            expect(staking.address).to.be.properAddress;
        })

        after(async () => {
            await lls.setStakingAddress(staking.address);
        })
    })
})