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

const GovernanceContract = artifacts.require("../contracts/GovernanceContract.sol");

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
    let governanceContract = await GovernanceContract.deployed();

    await governanceContract.initialize(
        treasuryContract.address,
        contributionVotingContract.address,
        recordsVotingContract.address,
        agreementContract.address,
        dilutionContract.address,
        await getEthAccount(0)
    );

    await recordsContract.initialize(contributionContract.address, recordsVotingContract.address);

    await recordsVotingContract.initialize(
        recordsContract.address,
        treasuryContract.address,
        treasuryCoreContract.address,
        governanceContract.address
    );

    await contributionContract.initialize(
        contributionVotingContract.address,
        recordsContract.address,
        tracksContract.address
    );

    await contributionVotingContract.initialize(
        treasuryContract.address,
        contributionContract.address,
        governanceContract.address
    );

    await ordersContract.initialize(treasuryContract.address, treasuryCoreContract.address);
    await ordersContract.setWalletAddress(await getEthAccount(9));

    await agreementContract.initialize(
        treasuryContract.address,
        treasuryCoreContract.address,
        crdTokenContract.address,
        governanceContract.address
    );

    await baseVotingContractMock.initialize(treasuryContract.address, governanceContract.address);
    await baseVotingCounterOfferContractMock.initialize(
        treasuryContract.address,
        governanceContract.address
    );

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

    await dilutionContract.initialize(treasuryContract.address, governanceContract.address);

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
    this.governanceContract = governanceContract;
}

module.exports = setup;

