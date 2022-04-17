import { expect, assert } from "chai";
import { ethers, waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IUniswapV2Factory, IUniswapV2Router02, /*TestERC20, IUniswapV2Pair */ } from '../typechain'

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

  before(async function () {

    this.ethers = ethers;
    [this.owner, this.user1, this.user2, this.user3] = await ethers.getSigners();

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

    // Token tokenPOP
    let Adapter = await ethers.getContractFactory("Adapter");
    adapter = await Contract.connect(this.owner).deploy(factory.address, router.address);
    await adapter.connect(this.owner).deployed();

    //snapshotId = await ethers.provider.send("evm_snapshot", []);

  });

  beforeEach(async function () {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
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

  it('Checking function createPool()', async () => {
    console.log(router.address, await router.WETH())
    assert(router.address);
  });

});
