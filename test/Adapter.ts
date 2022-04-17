import { expect, assert } from "chai";
import { ethers, waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IUniswapV2Factory } from '../typechain/IUniswapV2Factory';
import { IUniswapV2Pair } from '../typechain/IUniswapV2Pair';
import { IUniswapV2Router02 } from '../typechain/IUniswapV2Router02';
import { IUniswapV2PairInterface } from "../typechain/IUniswapV2Pair";

import bn from 'bignumber.js'
import { BigNumber } from 'ethers';
import chaiEthersBN from 'chai-ethers-bn';

function sqrt(value: BigNumber): BigNumber {
  return BigNumber.from(new bn(value.toString()).sqrt().toFixed().split('.')[0])
}
// Функция для получения timestamp блока
async function getTimestampBlock(bn: any) {
  return (await ethers.provider.getBlock(bn)).timestamp
}



describe.only("Adapter", function () {

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
  const MINIMUM_LIQUIDITY = 10 ** 3;
  let amountUser = ethers.utils.parseEther("1000");
  let amountToken1 = ethers.utils.parseEther("100");
  let amountToken2 = ethers.utils.parseEther("50");
  let amountEth = ethers.utils.parseEther("100");

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
    await tokenTST.transfer(user1.address, amountUser)
    await tokenACDM.transfer(user1.address, amountUser)
    await tokenPOP.transfer(user1.address, amountUser)

    // Апрувим токены для адаптера
    await tokenTST.connect(user1).approve(adapter.address, amountUser)
    await tokenACDM.connect(user1).approve(adapter.address, amountUser)
    await tokenPOP.connect(user1).approve(adapter.address, amountUser)

    await tokenTST.connect(owner).approve(adapter.address, amountUser)
    await tokenACDM.connect(owner).approve(adapter.address, amountUser)
    await tokenPOP.connect(owner).approve(adapter.address, amountUser)
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

    let Tx = await adapter.connect(user1).addLiquidityETH(
      tokenTST.address,
      amountToken1,
      amountTokenMin,
      amountEthMin,
      user1.address,
      deadline,
      { value: amountEth }
    )

    let pair = await ethers.getContractAt(
      "IUniswapV2Pair",
      await adapter.connect(user1).getPair(tokenTST.address, router.WETH())
    );

    let lpTokens = await pair.balanceOf(user1.address)

    // k = sqrt(a*b) - MINIMUM_LIQUIDITY
    let tmp = amountToken1.mul(amountEth); // a*b
    tmp = sqrt(tmp);  // sqrt
    tmp = tmp.sub(MINIMUM_LIQUIDITY);  // k

    // check lptokens
    expect(lpTokens).to.be.equal(tmp)

    // Проверяем эвент AddLiquidity
    await expect(Tx).to.emit(adapter, "AddLiquidity")
      .withArgs(user1.address, amountToken1, amountEth, lpTokens);

    let balance = await tokenTST.balanceOf(user1.address)
    Tx = await adapter.connect(user1).addLiquidityETH(
      tokenTST.address,
      amountToken1,
      amountTokenMin,
      amountEthMin,
      user1.address,
      deadline,
      { value: amountEth.div(2) }
    )
    // убеждаемся что отправили amountToken1 токенов , но вернулось amountToken1/2 
    // т.к эфира отправили в 2 раза меньше
    expect(await tokenTST.balanceOf(user1.address)).to.be.equal(
      balance.sub(amountToken1.div(2))
    )
  });

  it('Checking function removeLiquidityETH()', async () => {

    let Tx = await adapter.connect(user1).addLiquidityETH(
      tokenTST.address,
      amountToken1,
      amountTokenMin,
      amountEthMin,
      user1.address,
      deadline,
      { value: amountEth }
    )

    let pair = await ethers.getContractAt(
      "IUniswapV2Pair",
      await adapter.connect(user1).getPair(tokenTST.address, router.WETH())
    );

    let lpTokens = await pair.balanceOf(user1.address)
    await pair.connect(user1).approve(adapter.address, lpTokens)

    let balance = await tokenTST.balanceOf(user1.address)
    // удаляем пул
    Tx = await adapter.connect(user1).removeLiquidityETH(
      tokenTST.address,
      lpTokens,
      amountTokenMin,
      amountEthMin,
      user1.address,
      deadline
    )

    // Проверяем эвент RemoveLiquidity
    await expect(Tx).to.emit(adapter, "RemoveLiquidity")
      .withArgs(
        user1.address,
        amountToken1.sub(MINIMUM_LIQUIDITY),
        amountEth.sub(MINIMUM_LIQUIDITY),
        lpTokens
      );

    // убеждаемся что токены amountToken1 вернулись
    expect(await tokenTST.balanceOf(user1.address)).to.be.equal(
      balance.add(amountToken1.sub(MINIMUM_LIQUIDITY)))
  });


  it('Checking function addLiquidity()', async () => {

    let balanceTST = await tokenTST.balanceOf(user1.address)
    let balanceACDM = await tokenACDM.balanceOf(user1.address)

    let Tx = await adapter.connect(user1).addLiquidity(
      tokenTST.address,
      tokenACDM.address,
      amountToken1,
      amountToken2,
      amountTokenMin,
      amountTokenMin,
      user1.address,
      deadline
    )
    // Проверяем балансы токенов
    expect(await tokenTST.balanceOf(user1.address))
      .to.be.equal(balanceTST.sub(amountToken1))
    expect(await tokenACDM.balanceOf(user1.address))
      .to.be.equal(balanceACDM.sub(amountToken2))

    let pair = await ethers.getContractAt(
      "IUniswapV2Pair",
      await adapter.connect(user1).getPair(tokenTST.address, tokenACDM.address)
    );

    let lpTokens = await pair.balanceOf(user1.address)

    // k = sqrt(a*b) - MINIMUM_LIQUIDITY
    let tmp = amountToken1.mul(amountToken2); // a*b
    tmp = sqrt(tmp);  // sqrt
    tmp = tmp.sub(MINIMUM_LIQUIDITY);  // k
    //console.log(lpTokens, tmp)
    // check lptokens
    expect(lpTokens).to.be.equal(tmp)
    //console.log(amountToken1, amountEth, lpTokens)
    // Проверяем эвент AddLiquidity
    await expect(Tx).to.emit(adapter, "AddLiquidity")
      .withArgs(user1.address, amountToken1, amountToken2, lpTokens);

    // Проверяем пополнение пула с перекоcом в сторону tokenTST
    balanceTST = await tokenTST.balanceOf(user1.address)
    balanceACDM = await tokenACDM.balanceOf(user1.address)
    Tx = await adapter.connect(user1).addLiquidity(
      tokenTST.address,
      tokenACDM.address,
      amountToken1.div(2),
      amountToken2,
      amountTokenMin,
      amountTokenMin,
      user1.address,
      deadline
    )
    // Проверяем балансы токенов
    expect(await tokenTST.balanceOf(user1.address))
      .to.be.equal(balanceTST.sub(amountToken1.div(2)))
    expect(await tokenACDM.balanceOf(user1.address))
      .to.be.equal(balanceACDM.sub(amountToken2.div(2)))

    let lpTokens2Liquidity = await pair.balanceOf(user1.address)

    // k = sqrt(a*b) - MINIMUM_LIQUIDITY
    tmp = (amountToken1.div(2)).mul(amountToken2.div(2)); // a*b
    tmp = sqrt(tmp);  // sqrt
    // Последующие пополнения пула ликвидности рассчитываются без MINIMUM_LIQUIDITY
    //tmp = tmp.sub(MINIMUM_LIQUIDITY);  
    // check lptokens
    expect(lpTokens2Liquidity).to.be.equal(tmp.add(lpTokens))

    // Проверяем пополнение пула с перекоcом в сторону tokenACDM
    balanceTST = await tokenTST.balanceOf(user1.address)
    balanceACDM = await tokenACDM.balanceOf(user1.address)
    Tx = await adapter.connect(user1).addLiquidity(
      tokenTST.address,
      tokenACDM.address,
      amountToken1,
      amountToken2.div(2),
      amountTokenMin,
      amountTokenMin,
      user1.address,
      deadline
    )
    // Проверяем балансы токенов
    expect(await tokenTST.balanceOf(user1.address))
      .to.be.equal(balanceTST.sub(amountToken1.div(2)))
    expect(await tokenACDM.balanceOf(user1.address))
      .to.be.equal(balanceACDM.sub(amountToken2.div(2)))


  });

  it('Checking function removeLiquidity()', async () => {

    let Tx = await adapter.connect(user1).addLiquidity(
      tokenTST.address,
      tokenACDM.address,
      amountToken1,
      amountToken1,
      amountTokenMin,
      amountTokenMin,
      user1.address,
      deadline
    )

    let pair = await ethers.getContractAt(
      "IUniswapV2Pair",
      await adapter.connect(user1).getPair(tokenTST.address, tokenACDM.address)
    );

    let lpTokens = await pair.balanceOf(user1.address)

    await pair.connect(user1).approve(adapter.address, lpTokens)

    let balanceTST = await tokenTST.balanceOf(user1.address)
    let balanceACDM = await tokenACDM.balanceOf(user1.address)
    // удаляем пул
    Tx = await adapter.connect(user1).removeLiquidity(
      tokenTST.address,
      tokenACDM.address,
      lpTokens,
      amountTokenMin,
      amountTokenMin,
      user1.address,
      deadline
    )

    // Проверяем эвент RemoveLiquidity
    await expect(Tx).to.emit(adapter, "RemoveLiquidity")
      .withArgs(
        user1.address,
        amountToken1.sub(MINIMUM_LIQUIDITY),
        amountToken1.sub(MINIMUM_LIQUIDITY),
        lpTokens
      );

    // убеждаемся что токены  вернулись
    expect(await tokenTST.balanceOf(user1.address))
      .to.be.equal(balanceTST.add(amountToken1.sub(MINIMUM_LIQUIDITY)))
    expect(await tokenACDM.balanceOf(user1.address))
      .to.be.equal(balanceACDM.add(amountToken1.sub(MINIMUM_LIQUIDITY)))

  });


  it('Checking function swapExactTokensForTokens() swap TST/ACDM', async () => {

    let Tx = await adapter.connect(user1).addLiquidity(
      tokenTST.address,
      tokenACDM.address,
      amountToken1,
      amountToken1,
      amountTokenMin,
      amountTokenMin,
      user1.address,
      deadline
    )
    let Tx2 = await adapter.connect(user1).addLiquidity(
      tokenACDM.address,
      tokenPOP.address,
      amountToken1,
      amountToken1,
      amountTokenMin,
      amountTokenMin,
      user1.address,
      deadline
    )
    let balanceTST = await tokenTST.balanceOf(user1.address)
    let balanceACDM = await tokenACDM.balanceOf(user1.address)
    let swap = await adapter.connect(user1).swapExactTokensForTokens(
      amountToken1.div(100),
      amountTokenMin,
      [tokenTST.address, tokenACDM.address],
      user1.address,
      deadline
    )
    let getAmountOut = await adapter.connect(user1).getAmountIn(
      amountToken1.div(100),
      amountToken1.sub(MINIMUM_LIQUIDITY),
      amountToken1.sub(MINIMUM_LIQUIDITY),
    )
    getAmountOut = await adapter.connect(user1).getAmountOut(
      amountToken1.div(100),
      amountToken1.sub(MINIMUM_LIQUIDITY),
      amountToken1.sub(MINIMUM_LIQUIDITY),
    )

    // Проверяем эвент SwapTokens
    await expect(swap).to.emit(adapter, "SwapTokens")
      .withArgs(
        user1.address,
        [(amountToken1.div(100)), getAmountOut],
        [tokenTST.address, tokenACDM.address]
      );

    // Проверяем балансы
    expect(await tokenTST.balanceOf(user1.address))
      .to.be.equal(balanceTST.sub(amountToken1.div(100)))
    expect(await tokenACDM.balanceOf(user1.address))
      .to.be.equal(balanceACDM.add(getAmountOut))
  });
  it('Checking swap TST/ACDM => ACDM/POP', async () => {

    let Tx = await adapter.connect(user1).addLiquidity(
      tokenTST.address,
      tokenACDM.address,
      amountToken1,
      amountToken1,
      amountTokenMin,
      amountTokenMin,
      user1.address,
      deadline
    )
    let Tx2 = await adapter.connect(user1).addLiquidity(
      tokenACDM.address,
      tokenPOP.address,
      amountToken1,
      amountToken1,
      amountTokenMin,
      amountTokenMin,
      user1.address,
      deadline
    )
    let balanceTST = await tokenTST.balanceOf(user1.address)
    let balanceACDM = await tokenACDM.balanceOf(user1.address)
    let balancePOP = await tokenPOP.balanceOf(user1.address)

    let swap = await adapter.connect(user1).swapExactTokensForTokens(
      amountToken1.div(100),
      amountTokenMin,
      [tokenTST.address, tokenACDM.address, tokenPOP.address],
      user1.address,
      deadline
    )
    let getAmountOut = await adapter.connect(user1).getAmountOut(
      amountToken1.div(100),
      amountToken1.sub(MINIMUM_LIQUIDITY),
      amountToken1.sub(MINIMUM_LIQUIDITY),
    )

    let getAmountOut2 = await adapter.connect(user1).getAmountOut(
      getAmountOut,
      amountToken1.sub(MINIMUM_LIQUIDITY),
      amountToken1.sub(MINIMUM_LIQUIDITY),
    )

    // Проверяем эвент SwapTokens
    await expect(swap).to.emit(adapter, "SwapTokens")
      .withArgs(
        user1.address,
        [amountToken1.div(100), getAmountOut, getAmountOut2],
        [tokenTST.address, tokenACDM.address, tokenPOP.address]
      );

    // Проверяем балансы
    expect(await tokenTST.balanceOf(user1.address))
      .to.be.equal(balanceTST.sub(amountToken1.div(100)))
    expect(await tokenPOP.balanceOf(user1.address))
      .to.be.equal(balancePOP.add(getAmountOut2))

  });
});
