const ChonMarsToken = artifacts.require("ChonMarsToken");

module.exports = async function (deployer) {
  await deployer.deploy(ChonMarsToken);
};
