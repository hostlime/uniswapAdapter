import { expect, assert } from "chai";
import { ethers, waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IUniswapV2Factory } from '../typechain/IUniswapV2Factory';
import { IUniswapV2Pair } from '../typechain/IUniswapV2Pair';
import { IUniswapV2Router02 } from '../typechain/IUniswapV2Router02';
import { IUniswapV2PairInterface } from "../typechain/IUniswapV2Pair";


// Функция для получения timestamp блока
async function getTimestampBlock(bn: any) {
  return (await ethers.provider.getBlock(bn)).timestamp
}



describe.only("Greeter", function () {

  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  let adapter: any;
  let tokenTST: any;
  let tokenACDM: any;
  let tokenPOP: any;

  let factory: any;
  let router: any;

  let snapshotId: any;

  let amountToken1 = ethers.utils.parseEther("100");
  let amountToken2 = ethers.utils.parseEther("50");
  let amountEth = ethers.utils.parseEther("1");

  let amountTokenMin = ethers.utils.parseEther("0.00001");
  let amountEthMin = ethers.utils.parseEther("0.00001");
  let deadline: any;
  before(async function () {


    [owner, user1, user2, user3] = await ethers.getSigners();

    factory = (await ethers.getContractAt("IUniswapV2Factory", process.env.FACTORY_ADDRESS as string));
    router = (await ethers.getContractAt("IUniswapV2Router02", process.env.ROUTER_ADDRESS as string));


    // Token TST
    let Contract = await ethers.getContractFactory("Token");
    tokenTST = await Contract.connect(owner).deploy("TokenA", "TST");
    await tokenTST.connect(owner).deployed();

    // Token tokenACDM
    Contract = await ethers.getContractFactory("Token");
    tokenACDM = await Contract.connect(owner).deploy("TokenB", "ACDM");
    await tokenACDM.connect(owner).deployed();

    // Token tokenPOP
    Contract = await ethers.getContractFactory("Token");
    tokenPOP = await Contract.connect(owner).deploy("TokenC", "POP");
    await tokenPOP.connect(owner).deployed();

    // Token Adapter
    let Adapter = await ethers.getContractFactory("Adapter");
    adapter = await Adapter.connect(owner).deploy(factory.address, router.address);
    let tx = await adapter.connect(owner).deployed();
    deadline = await getTimestampBlock(tx.blockNumber)
    deadline *= 2

    // Переводим порльзователю токены
    await tokenTST.transfer(user1.address, amountToken1)
    await tokenACDM.transfer(user1.address, amountToken1)
    await tokenPOP.transfer(user1.address, amountToken1)

    // Апрувим токены для адаптера
    await tokenTST.connect(user1).approve(adapter.address, amountToken1)
    await tokenACDM.connect(user1).approve(adapter.address, amountToken1)
    await tokenPOP.connect(user1).approve(adapter.address, amountToken1)

    await tokenTST.connect(owner).approve(adapter.address, amountToken1)
    await tokenACDM.connect(owner).approve(adapter.address, amountToken1)
    await tokenPOP.connect(owner).approve(adapter.address, amountToken1)
  });

  beforeEach(async function () {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
    /*
        factory = (await ethers.getContractAt("IUniswapV2Factory", process.env.FACTORY_ADDRESS as string));
        router = (await ethers.getContractAt("IUniswapV2Router02", process.env.ROUTER_ADDRESS as string));
    
    
        // Token TST
        let Contract = await ethers.getContractFactory("Token");
        tokenTST = await Contract.connect(this.owner).deploy("TokenA", "TST");
        await tokenTST.connect(this.owner).deployed();
    
        // Token tokenACDM
        Contract = await ethers.getContractFactory("Token");
        tokenACDM = await Contract.connect(this.owner).deploy("TokenB", "ACDM");
        await tokenACDM.connect(this.owner).deployed();
    
        // Token tokenPOP
        Contract = await ethers.getContractFactory("Token");
        tokenPOP = await Contract.connect(this.owner).deploy("TokenC", "POP");
        await tokenPOP.connect(this.owner).deployed();
    
        // Token Adapter
        let Adapter = await ethers.getContractFactory("Adapter");
        adapter = await Adapter.connect(this.owner).deploy(factory.address, router.address);
        await adapter.connect(this.owner).deployed();
    */
  });
  afterEach(async function () {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  it('Checking that contract factory is deployed', async () => {
    assert(factory.address);
  });
  it('Checking that contract router is deployed', async () => {
    assert(router.address);
  });

  it('Checking that contract tokenTST is deployed', async () => {
    assert(tokenTST.address);
  });
  it('Checking that contract tokenACDM is deployed', async () => {
    assert(tokenACDM.address);
  });
  it('Checking that contract tokenPOP is deployed', async () => {
    assert(tokenPOP.address);

  });

  it('Checking that contract adapter is deployed', async () => {
    assert(adapter.address);
  });
  it('Checking that contract adapter is correctly initialized', async () => {
    expect(await adapter.factory()).to.be.equal(factory.address)
    expect(await adapter.router02()).to.be.equal(router.address)
  });

  it('Checking function createPool()', async () => {
    let Tx = await adapter.createPool(tokenTST.address, tokenACDM.address)
    let pair = await adapter.getPair(tokenTST.address, tokenACDM.address)
    expect(pair)

    // Проверяем эвент CreatePool
    await expect(Tx).to.emit(adapter, "CreatePool")
      .withArgs(tokenTST.address, tokenACDM.address, pair);
  });

  it('Checking function addLiquidityETH()', async () => {

    const tx = await adapter.connect(user1).addLiquidityETH(
      tokenTST.address,
      amountToken1,
      amountTokenMin,
      amountEthMin,
      user1.address,
      deadline,
      { value: amountEth }
    )
    /*
    const { events } = tx.wait();
    const { args } = events.find(
      ({ event }: { event: any }) => event === "AddLiquidity"
    );*/
    const { _amountOne, _amountTwo, _liquidityAmount } = tx;
    console.log(_amountOne, _amountTwo, _liquidityAmount)

    let pair = await adapter.connect(user1).getPair(tokenTST.address, router.WETH())
    console.log(pair.balanceOf())
    await pair.balanceOf(user1.address)
    console.log(await pair.balanceOf(user1.address))
    //const { 0: amountToken, 1: amountETH, 2: liquidity } = Tx
    // Проверяем эвент CreatePool
    //   await expect(Tx).to.emit(adapter, "AddLiquidity")
    //     .withArgs(tokenTST.address, tokenACDM.address, pair);
    //console.log(amountToken, amountETH, liquidity)
    //expect(await adapter.getPair(tokenTST.address, tokenACDM.address))
  });
});
