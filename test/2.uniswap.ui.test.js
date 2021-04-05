
const ChonMarsToken = artifacts.require("ChonMarsToken");
const { expectRevert, time } = require("@openzeppelin/test-helpers");

const WETH = artifacts.require("WETH");

contract("ChonMarsToken",() => {
  it("test", async () => {
    let cmt = await ChonMarsToken.deployed();
    let account_address = "0xA3358aaf77717a6f24DF8542824bABA32a8c666B";
    let balance = (await cmt.balanceOf(account_address)).valueOf();
    assert.equal(balance.toString(),"10000000000000000000000");
  });
});
