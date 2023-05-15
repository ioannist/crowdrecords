const ContributionContract = artifacts.require("../contracts/ContributionContract.sol");
const RecordsContract = artifacts.require("../contracts/RecordsContract.sol");
const RecordsVotingContract = artifacts.require("../contracts/RecordsVotingContract.sol");
const TracksContract = artifacts.require("../contracts/TracksContract.sol");
const TreasuryContract = artifacts.require("../contracts/treasury/TreasuryContract.sol");
const TreasuryCoreContract = artifacts.require("../contracts/treasury/TreasuryCoreContract.sol");
const CrdTokenContract = artifacts.require("../contracts/treasury/CrdTokenContract.sol");
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

const CrowdrecordsGovernor = artifacts.require("../contracts/governance/CrowdrecordsGovernor.sol");
const ControllerContract = artifacts.require("../contracts/ControllerContract.sol");

const { VOTING_INTERVAL_BLOCKS, getEthAccount } = require("./helper");

async function setup() {
    let tracksContract = await TracksContract.deployed();
    let contributionContract = await ContributionContract.deployed();
    let recordsContract = await RecordsContract.deployed();
    let recordsVotingContract = await RecordsVotingContract.deployed();
    let treasuryContract = await TreasuryContract.deployed();
    let treasuryCoreContract = await TreasuryCoreContract.deployed();
    let crdTokenContract = await CrdTokenContract.deployed();
    let contributionVotingContract = await ContributionVotingContract.deployed(
        VOTING_INTERVAL_BLOCKS
    );
    let ordersContract = await OrdersContract.deployed();
    let agreementContract = await AgreementContract.deployed();
    let baseVotingContractMock = await BaseVotingContractMock.deployed();
    let baseVotingCounterOfferContractMock = await BaseVotingCounterOfferContractMock.deployed();
    let votingHubContract = await VotingHubContract.deployed();
    let dilutionContract = await DilutionContract.deployed();
    let crowdrecordsGovernor = await CrowdrecordsGovernor.deployed();
    let controllerContract = await ControllerContract.deployed();

    this.tracksContract = tracksContract;
    this.contributionContract = contributionContract;
    this.recordsContract = recordsContract;
    this.recordsVotingContract = recordsVotingContract;
    this.treasuryContract = treasuryContract;
    this.treasuryCoreContract = treasuryCoreContract;
    this.crdTokenContract = crdTokenContract;
    this.contributionVotingContract = contributionVotingContract;
    this.ordersContract = ordersContract;
    this.agreementContract = agreementContract;
    this.baseVotingContractMock = baseVotingContractMock;
    this.baseVotingCounterOfferContractMock = baseVotingCounterOfferContractMock;
    this.votingHubContract = votingHubContract;
    this.dilutionContract = dilutionContract;
    this.crowdrecordsGovernor = crowdrecordsGovernor;
    this.controllerContract = controllerContract;
}

module.exports = setup;

