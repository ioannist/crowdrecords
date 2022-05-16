const ContributionContract = artifacts.require("../contracts/ContributionContract.sol");
const RecordsContract = artifacts.require("../contracts/RecordsContract.sol");
const TracksContract = artifacts.require("../contracts/TracksContract.sol");
const TreasuryContract = artifacts.require("../contracts/TreasuryContract.sol");
const ContributionVotingContract = artifacts.require(
    "../contracts/voting/ContributionVotingContract.sol"
);
const OrdersContract = artifacts.require("../contracts/OrdersContract.sol");

const { VOTING_INTERVAL_BLOCKS } = require("./helper");

async function setup() {
    let tracksContract = await TracksContract.deployed();
    let contributionContract = await ContributionContract.deployed();
    let recordsContract = await RecordsContract.deployed();
    let treasuryContract = await TreasuryContract.deployed();
    let contributionVotingContract = await ContributionVotingContract.deployed(
        VOTING_INTERVAL_BLOCKS
    );
    let ordersContract = await OrdersContract.deployed();

    await contributionContract.setContributionVotingContractAddress(
        contributionVotingContract.address
    );

    await treasuryContract.setRecordsContractAddress(recordsContract.address);

    await contributionVotingContract.setTreasuryContractAddress(treasuryContract.address);
    await contributionVotingContract.setContributionContractAddress(contributionContract.address);
    await contributionVotingContract.setOrderContractAddress(ordersContract.address);

    await ordersContract.setTreasuryContractAddress(treasuryContract.address);
    await treasuryContract.setContributionVotingContractAddress(contributionVotingContract.address);

    this.tracksContract = tracksContract;
    this.contributionContract = contributionContract;
    this.recordsContract = recordsContract;
    this.treasuryContract = treasuryContract;
    this.contributionVotingContract = contributionVotingContract;
    this.ordersContract = ordersContract;
}

module.exports = setup;

