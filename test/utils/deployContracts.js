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

const { VOTING_INTERVAL_BLOCKS, DILUTION_INTERVAL_BLOCKS, getEthAccount } = require("./helper");

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
    let dilutionContract = await DilutionContract.deployed(
        VOTING_INTERVAL_BLOCKS,
        DILUTION_INTERVAL_BLOCKS
    );

    await recordsContract.initialize(contributionContract.address, recordsVotingContract.address);

    await recordsVotingContract.initialize(
        recordsContract.address,
        treasuryContract.address,
        treasuryCoreContract.address
    );

    await contributionContract.initialize(
        contributionVotingContract.address,
        recordsContract.address,
        tracksContract.address
    );

    await contributionVotingContract.initialize(
        treasuryContract.address,
        contributionContract.address
    );

    await ordersContract.initialize(treasuryContract.address, treasuryCoreContract.address);
    await ordersContract.setWalletAddress(await getEthAccount(9));

    await agreementContract.initialize(
        treasuryContract.address,
        treasuryCoreContract.address,
        crdTokenContract.address
    );

    await baseVotingContractMock.initialize(treasuryContract.address);
    await baseVotingCounterOfferContractMock.initialize(treasuryContract.address);

    await votingHubContract.setTreasuryCoreContractAddress(treasuryCoreContract.address);
    await votingHubContract.addVotingContract(contributionVotingContract.address);
    await votingHubContract.addVotingContract(agreementContract.address);
    await votingHubContract.addVotingContract(dilutionContract.address);
    await votingHubContract.addVotingContract(recordsVotingContract.address);

    await treasuryContract.initialize(
        treasuryCoreContract.address,
        recordsContract.address,
        recordsVotingContract.address,
        dilutionContract.address,
        contributionVotingContract.address
    );
    await treasuryContract.addSnapshotCaller(agreementContract.address);
    await treasuryContract.addSnapshotCaller(recordsVotingContract.address);

    await crdTokenContract.initialize(
        treasuryContract.address,
        treasuryCoreContract.address,
        agreementContract.address
    );

    await treasuryCoreContract.initialize(
        votingHubContract.address,
        treasuryContract.address,
        crdTokenContract.address
    );

    await dilutionContract.initialize(treasuryContract.address);

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
}

module.exports = setup;

