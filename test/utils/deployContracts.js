const ContributionContract = artifacts.require("../contracts/ContributionContract.sol");
const RecordsContract = artifacts.require("../contracts/RecordsContract.sol");
const RecordsVotingContract = artifacts.require("../contracts/RecordsVotingContract.sol");
const TracksContract = artifacts.require("../contracts/TracksContract.sol");
const TreasuryContract = artifacts.require("../contracts/treasury/TreasuryContract.sol");
const TreasuryCoreContract = artifacts.require("../contracts/treasury/TreasuryCoreContract.sol");
const ContributionVotingContract = artifacts.require(
    "../contracts/voting/ContributionVotingContract.sol"
);
const OrdersContract = artifacts.require("../contracts/OrdersContract.sol");
const AgreementContract = artifacts.require("../contracts/AgreementContract.sol");

const BaseVotingContractMock = artifacts.require("../contracts/Mocks/BaseVotingContractMock.sol");
const BaseVotingCounterOfferContractMock = artifacts.require(
    "../contracts/Mocks/BaseVotingCounterOfferContractMock.sol"
);

const VotingHubContract = artifacts.require("../contracts/Mocks/VotingHubContract.sol");
const DilutionContract = artifacts.require("../contracts/DilutionContract.sol");

const { VOTING_INTERVAL_BLOCKS, DILUTION_INTERVAL_BLOCKS, getEthAccount } = require("./helper");

async function setup() {
    let tracksContract = await TracksContract.deployed();
    let contributionContract = await ContributionContract.deployed();
    let recordsContract = await RecordsContract.deployed();
    let recordsVotingContract = await RecordsVotingContract.deployed();
    let treasuryContract = await TreasuryContract.deployed();
    let treasuryCoreContract = await TreasuryCoreContract.deployed();
    let contributionVotingContract = await ContributionVotingContract.deployed(
        VOTING_INTERVAL_BLOCKS
    );
    let ordersContract = await OrdersContract.deployed();
    let agreementContract = await AgreementContract.deployed();
    let baseVotingContractMock = await BaseVotingContractMock.deployed();
    let baseVotingCounterOfferContractMock = await BaseVotingCounterOfferContractMock.deployed();
    let votingHubContract = await VotingHubContract.deployed();
    let dilutionContract = await DilutionContract.deployed(
        VOTING_INTERVAL_BLOCKS,
        DILUTION_INTERVAL_BLOCKS
    );

    await contributionContract.setContributionVotingContractAddress(
        contributionVotingContract.address
    );

    await recordsContract.setContributionContractAddress(contributionContract.address);
    await recordsContract.setRecordsVotingContractAddress(recordsVotingContract.address);
    // await recordsContract.setTreasuryContractAddress(treasuryContract.address);

    await recordsVotingContract.setTreasuryContractAddress(treasuryContract.address);
    await recordsVotingContract.setTreasuryCoreContractAddress(treasuryCoreContract.address);
    await recordsVotingContract.setRecordsContractAddress(recordsContract.address);

    await contributionContract.setRecordsContractAddress(recordsContract.address);

    await contributionVotingContract.setTreasuryContractAddress(treasuryContract.address);
    await contributionVotingContract.setContributionContractAddress(contributionContract.address);

    await ordersContract.setTreasuryContractAddress(treasuryContract.address);
    await ordersContract.setTreasuryCoreContractAddress(treasuryCoreContract.address);
    await ordersContract.setWalletAddress(await getEthAccount(9));

    await agreementContract.setTreasuryContractAddress(treasuryContract.address);
    await agreementContract.setTreasuryCoreContractAddress(treasuryCoreContract.address);

    await baseVotingContractMock.setTreasuryContractAddress(treasuryContract.address);
    await baseVotingCounterOfferContractMock.setTreasuryContractAddress(treasuryContract.address);

    await votingHubContract.setTreasuryCoreContractAddress(treasuryCoreContract.address);
    await votingHubContract.addVotingContract(contributionVotingContract.address);
    await votingHubContract.addVotingContract(agreementContract.address);
    await votingHubContract.addVotingContract(dilutionContract.address);
    await votingHubContract.addVotingContract(recordsVotingContract.address);

    await treasuryContract.setDilutionContract(dilutionContract.address);
    await treasuryContract.setContributionVotingContractAddress(contributionVotingContract.address);
    await treasuryContract.setRecordsContractAddress(recordsContract.address);
    await treasuryContract.setRecordsVotingContractAddress(recordsVotingContract.address);
    await treasuryContract.setCoreTreasuryAddress(treasuryCoreContract.address);

    await treasuryCoreContract.setVotingHubContract(votingHubContract.address);
    await treasuryCoreContract.setTreasuryContract(treasuryContract.address);

    await dilutionContract.setTreasuryContractAddress(treasuryContract.address);

    this.tracksContract = tracksContract;
    this.contributionContract = contributionContract;
    this.recordsContract = recordsContract;
    this.recordsVotingContract = recordsVotingContract;
    this.treasuryContract = treasuryContract;
    this.treasuryCoreContract = treasuryCoreContract;
    this.contributionVotingContract = contributionVotingContract;
    this.ordersContract = ordersContract;
    this.agreementContract = agreementContract;
    this.baseVotingContractMock = baseVotingContractMock;
    this.baseVotingCounterOfferContractMock = baseVotingCounterOfferContractMock;
    this.votingHubContract = votingHubContract;
    this.dilutionContract = dilutionContract;
}

module.exports = setup;

