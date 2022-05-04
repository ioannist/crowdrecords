const ContributionContract = artifacts.require("../contracts/ContributionContract.sol");
const RecordsContract = artifacts.require("../contracts/RecordsContract.sol");
const TracksContract = artifacts.require("../contracts/TracksContract.sol");
const TreasuryContract = artifacts.require("../contracts/TreasuryContract.sol");
const ContributionVotingContract = artifacts.require(
    "../contracts/voting/ContributionVotingContract.sol"
);
const OrdersContract = artifacts.require("../contracts/OrdersContract.sol");

module.exports = async (deployer) => {
    await deployer.deploy(ContributionContract);
    let contributionContract = await ContributionContract.deployed();
    await deployer.deploy(RecordsContract);
    let recordsContract = await RecordsContract.deployed();
    await deployer.deploy(TracksContract);
    let tracksContract = await TracksContract.deployed();
    await deployer.deploy(TreasuryContract);
    let treasuryContract = await TreasuryContract.deployed();
    await deployer.deploy(ContributionVotingContract, 20);
    let contributionVotingContract = await ContributionVotingContract.deployed();
    await deployer.deploy(OrdersContract);
    let ordersContract = await OrdersContract.deployed();
};

