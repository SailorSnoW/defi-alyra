const { hre, ethers } = require("hardhat");
const { BigNumber } = ethers;

module.exports = {
  DeFiFork: async () => {

    // needed to decode events log and retrieve the created pair contract address
    const factoryArtifact = require("../artifacts/contracts/1_UniswapV2Forked/LLSwapFactory.sol/LLSwapFactory.json");
    const pairArtifact = require("../artifacts/contracts/1_UniswapV2Forked/LLSwapPair.sol/LLSwapPair.json");
    const factory_abi = factoryArtifact.abi;
    const pair_abi = pairArtifact.abi;

    let iface = new ethers.utils.Interface(factory_abi);
  

    
    /** @description Deploy the forked Uniswap V2 contracts (Factory, Router) and the forked WETH contract */
    async function deploy_LLcontracts() {
      const accounts = await ethers.getSigners();
      const feeToSetter = accounts[1];
  
      // get the contracts to deploy
      const LLSwapFactory = await ethers.getContractFactory("LLSwapFactory");
      const LLSwapRouter02 = await ethers.getContractFactory("LLSwapRouter02");
      // note that we also need to deploy the WETH token now to use it with the router
      const WETH = await ethers.getContractFactory("WETH");
  
      // deploy on the network each contracts
      this.factory = await LLSwapFactory.deploy(feeToSetter.address);
      await factory.deployed();
      console.log("Factory deployed to:", factory.address);
  
      this.weth = await WETH.deploy();
      await this.weth.deployed();
      console.log("WETH deployed to:", this.weth.address);
  
      // router is constructed with the factory address and the weth address
      this.router = await LLSwapRouter02.deploy(factory.address, weth.address);
      await router.deployed();
      console.log("Router deployed to:", router.address);
    }
  
    /** @description Deploy the fake ERC20 tokens (fUSDT, fUSDC, fDAI)  */
    async function deploy_tokens() {
      const fUSDC = await ethers.getContractFactory("fUSDC");
      const fUSDT = await ethers.getContractFactory("fUSDT");
      const fDAI = await ethers.getContractFactory("fDAI");
  
      this.fusdc = await fUSDC.deploy();
      await fusdc.deployed();
      console.log("fUSDC deployed to:", fusdc.address);
  
      this.fusdt = await fUSDT.deploy();
      await fusdt.deployed();
      console.log("fUSDT deployed to:", fusdt.address);
  
      this.fdai = await fDAI.deploy();
      await fdai.deployed();
      console.log("fDAI deployed to:", fdai.address);
    }
  
    /**
     *  @description Create WETH pair contracts for each fake ERC20 token (i.e fUSDT/WETH pair)
     *  @dev contract pair is created by calling the Factory contract with the addresses of each token of the wanted pair
     */
    async function createPairs() {
      // tokens addresses
      const WETH = this.weth.address;
      const fUSDT = this.fusdt.address;
      const fUSDC = this.fusdc.address;
      const fDAI = this.fdai.address;
  
      // factory contract
      const Factory = this.factory;
  
      // creating pairs
      await Factory.createPair(fUSDC, WETH);
      await Factory.createPair(fUSDT, WETH);
      await Factory.createPair(fDAI, WETH);
  
      // retrieving pair contract addresses
      const filter = {
        address: this.factory.address,
        fromBlock: 0,
        toBlock: 10000,
      };
      const logs = await ethers.provider.getLogs(filter);
  
      this.fUSDC_WETH = new ethers.Contract(
        iface.parseLog(logs[0]).args.pair,
        pair_abi,
        ethers.provider
      );
      this.fUSDT_WETH = new ethers.Contract(
        iface.parseLog(logs[1]).args.pair,
        pair_abi,
        ethers.provider
      );
      this.fDAI_WETH = new ethers.Contract(
        iface.parseLog(logs[2]).args.pair,
        pair_abi,
        ethers.provider
      );
    }
  
    /**
     *  @description add liquidity to each created pair contract
     *  @dev as nobody have any fake ERC20 tokens, we also mint some to each accounts which will provide liquidity
     */
    async function addPairsLiquidity() {
      const accounts = await ethers.getSigners();

      // describe addresses which will add liquidity to respective pair
      const fUSDT_WETH_Provider = accounts[2];
      const fUSDC_WETH_Provider = accounts[3];
      const fDAI_WETH_Provider = accounts[4];
  
      // minting 100 of each tokens to provide
      await this.fusdt.mint(
        fUSDT_WETH_Provider.address,
        ethers.utils.parseEther("100")
      );
      await this.fusdc.mint(
        fUSDC_WETH_Provider.address,
        ethers.utils.parseEther("100")
      );
      await this.fdai.mint(
        fDAI_WETH_Provider.address,
        ethers.utils.parseEther("100")
      );

      // approving router contract to deposit funds
      await this.fusdt
        .connect(fUSDT_WETH_Provider)
        .approve(this.router.address, ethers.utils.parseEther("100"));
      await this.fusdc
        .connect(fUSDC_WETH_Provider)
        .approve(this.router.address, ethers.utils.parseEther("100"));
      await this.fdai
        .connect(fDAI_WETH_Provider)
        .approve(this.router.address, ethers.utils.parseEther("100"));


      /**
       *  adding liquidity to each pairs
       *  @dev 'amountAMin' and 'amountBMin' is 0 because we don't expect a minimum deposit amount actually,
       *  @dev 'deadline' is set to a high timestamp to actually be sure that the transaction doesn't expire.
       */
      await this.router
        .connect(fUSDT_WETH_Provider)
        .addLiquidityETH(
          fusdt.address,
          ethers.utils.parseEther("100"),
          0,
          0,
          fUSDT_WETH_Provider.address,
          1838497206,
          {value: ethers.utils.parseEther("100")}
        );
      await this.router
        .connect(fUSDC_WETH_Provider)
        .addLiquidityETH(
          fusdc.address,
          ethers.utils.parseEther("100"),
          0,
          0,
          fUSDC_WETH_Provider.address,
          1838497206,
          {value: ethers.utils.parseEther("100")}
        );
      await this.router
        .connect(fDAI_WETH_Provider)
        .addLiquidityETH(
          fdai.address,
          ethers.utils.parseEther("100"),
          0,
          0,
          fDAI_WETH_Provider.address,
          1838497206,
          {value: ethers.utils.parseEther("100")}
        );
    }
  
    /** @description make a swap using one of the created contract pair */
    async function doOneSwap() {
      const accounts = await ethers.getSigners();
      
      const user = accounts[5];

      // swap 25 fusdt against 25 weth
      await this.router
        .connect(user)
        .swapETHForExactTokens(
          ethers.utils.parseEther("25"),
          [weth.address, fdai.address],
          user.address,
          1838497206,
          {value: ethers.utils.parseEther("34")}
        );

      /** 
      let newDAIBalance = await fdai.balanceOf(user.address);
      console.log("fDAI: ", ethers.utils.formatEther(BigNumber.from(newDAIBalance)));
      let newWETHBalance = await weth.balanceOf(user.address);
      console.log("fWETH: ", ethers.utils.formatEther(BigNumber.from(newWETHBalance)));
      */
    }
    




    /**
     *  @description deploy the masterChef contract and the LLS token contract
     *  @dev note that LLS need to be deployed before the masterChef contract as we need it to deploy it
     */
    async function deploy_masterChef() {
      const accounts = await ethers.getSigners();
      const devMasterchef = accounts[6];


      const LLS = await ethers.getContractFactory("LLS");
      const LLMasterChef = await ethers.getContractFactory("LLMasterChef");

      this.lls = await LLS.deploy();
      await lls.deployed();
      console.log("LLS deployed to:", lls.address);

      const currentBlock = await ethers.provider.getBlockNumber();
      this.masterchef = await LLMasterChef.deploy(
        lls.address,
        devMasterchef.address,
        ethers.utils.parseEther("10"),
        currentBlock,
        currentBlock + 100 
      );
      await masterchef.deployed();
      console.log("MasterChef deployed to:", masterchef.address);

      await lls.setMasterChefAddress(masterchef.address);
    }

    /**
     *  @description add the created pairs into the masterchef pool
     *  @dev pool rewards ratio is defined as:
     *       fUSDC/WETH (30%), fUSDT/WETH (20%) and fDAI/WETHc(50%)
     */
    async function addPools() {
      await this.masterchef.add(
        30,
        this.fUSDC_WETH.address,
        true
      )
      await this.masterchef.add(
        20,
        this.fUSDT_WETH.address,
        true
      )
      await this.masterchef.add(
        50,
        this.fDAI_WETH.address,
        true
      )
    }

    /** @description deploy the staking contract authorize it to mint on LLS */
    async function deploy_Staking() {
      // deploy the staking contract
      const LLStaking = await ethers.getContractFactory("LLStaking");

      this.staking = await LLStaking.deploy(this.lls.address);
      await staking.deployed();
      console.log("Staking deployed to:", staking.address);



      // add staking contract address to authorize mint of LLS token
      await this.lls.setStakingAddress(staking.address);
    }
    
    // Part 1: Fork UniswapV2
    await deploy_LLcontracts();
    await deploy_tokens();
  
    await createPairs();
  
    await addPairsLiquidity();
  
    await doOneSwap();

    // Part 2: Fork Masterchef Sushiswap
    await deploy_masterChef();

    await addPools();

    // Part 3: Staking contract
    await deploy_Staking();
  }
}
