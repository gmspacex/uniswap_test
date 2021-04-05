
const ChonMarsToken = artifacts.require("ChonMarsToken");
const { expectRevert, time } = require("@openzeppelin/test-helpers");

const WETH = artifacts.require("WETH");
const UniswapV2Pair = artifacts.require("UniswapV2Pair");
const UniswapV2Factory = artifacts.require("UniswapV2Factory");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");

const WETH_AMOUNT = 100 * 10 ** 18 // 100 WETH
const CMT_AMOUNT = 10000 * 10 ** 6  // 10000 CMT

const WETH_LIQUIDITY_AMOUNT = 10 * 10 ** 18 // 10 WETH
const CMT_LIQUIDITY_AMOUNT = 1000 * 10 ** 6  // 1000 CMT

const WETH_LIQUIDITY_MIN_AMOUNT = 0.01 * 10 ** 18 // 0.01 WETH
const CMT_LIQUIDITY_MIN_AMOUNT = 1 * 10 ** 6   // 1 CMT

const WETH_SWAP_AMOUNT = 1 * 10 ** 18 // 1 WETH
const CMT_SWAP_AMOUNT = 100 * 10 ** 6 // 100 CMT

contract("ChonMarsToken", () => {
  let chon, mars, minter, dev;
  it("test", async () => {
    [chon, mars, minter, dev] = await web3.eth.getAccounts();
    this.factory = await UniswapV2Factory.new(chon, { from: chon });

    // MARS -> Deposit WETH of WETH_AMOUNT
    this.weth = await WETH.new({ from: mars });
    await this.weth.deposit({ from: chon, value: WETH_AMOUNT.toString() });
    assert.equal(
      (await this.weth.balanceOf(chon))
        .valueOf()
        .toString(),
      WETH_AMOUNT.toString()
    );

    // CHON -> Deposit CMT of CMT_AMOUNT
    this.cmt = await ChonMarsToken.new(
      "ChonMarsToken",
      "CMT",
      6,
      chon,
      CMT_AMOUNT.toString(),
      { from: chon }
    );
    assert.equal(
      (await this.cmt.balanceOf(chon))
        .valueOf()
        .toString(),
      CMT_AMOUNT.toString()
    );

    this.router = await UniswapV2Router02.new(
      this.factory.address,
      this.weth.address,
      { from: chon }
    );

    // Create WETH/CMT pair
    await this.factory.createPair(
      this.weth.address,
      this.cmt.address,
    );
    this.cmt_weth_pair = await UniswapV2Pair.at(
      await this.factory.getPair(this.weth.address, this.cmt.address)
    );
    // Approve CMT, WETH token address to allow withdraw from chon
    await this.weth.approve(this.router.address, WETH_AMOUNT.toString(), { from: chon });
    await this.cmt.approve(this.router.address, CMT_AMOUNT.toString(), { from: chon });

    // Add Liquidity to WETH/ETH pair from chon
    await this.router.addLiquidity(
      this.weth.address,
      this.cmt.address,
      WETH_LIQUIDITY_AMOUNT.toString(),
      CMT_LIQUIDITY_AMOUNT.toString(),
      WETH_LIQUIDITY_MIN_AMOUNT.toString(),
      CMT_LIQUIDITY_MIN_AMOUNT.toString(),
      minter,
      15999743005,
      { from: chon }
    );

    // Check chon's WETH & CMT balance after adding liquidity
    assert.equal(
      (await this.weth.balanceOf(chon))
        .valueOf()
        .toString(),
      (WETH_AMOUNT - WETH_LIQUIDITY_AMOUNT).toString()
    );
    assert.equal(
      (await this.cmt.balanceOf(chon))
        .valueOf()
        .toString(),
      (CMT_AMOUNT - CMT_LIQUIDITY_AMOUNT).toString()
    );

    // Check WETH/CMT pair balances
    assert.equal(
      (await this.weth.balanceOf(this.cmt_weth_pair.address))
        .valueOf()
        .toString(),
      WETH_LIQUIDITY_AMOUNT.toString()
    );
    assert.equal(
      (await this.cmt.balanceOf(this.cmt_weth_pair.address))
        .valueOf()
        .toString(),
      CMT_LIQUIDITY_AMOUNT.toString()
    );

    // Swap WETH <-> CMT
    await this.router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      WETH_SWAP_AMOUNT.toString(),
      "0",
      [this.weth.address, this.cmt.address],
      dev,
      15999743005,
      { from: chon }
    );

    assert.equal(
      (await this.weth.balanceOf(dev))
        .valueOf()
        .toString(),
      "0"
    );

    assert.equal(
      (await this.cmt.balanceOf(dev))
        .valueOf()
        .toString(),
      "90661089"
    );
  });
});
