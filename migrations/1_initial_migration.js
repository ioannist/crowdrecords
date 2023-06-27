const ContributionContract = artifacts.require("../contracts/ContributionContract.sol");
const RecordsContract = artifacts.require("../contracts/RecordsContract.sol");
const RecordsVotingContract = artifacts.require("../contracts/RecordsVotingContract.sol");
const TracksContract = artifacts.require("../contracts/TracksContract.sol");
// const TreasuryContract = artifacts.require("../contracts/TreasuryContract.sol");
const TreasuryContract = artifacts.require("../contracts/treasury/TreasuryContract.sol");
const TreasuryCoreContract = artifacts.require("../contracts/treasury/TreasuryCoreContract.sol");
const CrdTokenContract = artifacts.require("../contracts/treasury/CrdTokenContract.Sol");
const TreasuryCoreMockContract = artifacts.require(
    "../contracts/Mocks/TreasuryCoreContractMock.sol"
);
const ContributionVotingContract = artifacts.require(
    "../contracts/voting/ContributionVotingContract.sol"
);
const OrdersContract = artifacts.require("../contracts/OrdersContract.sol");
const AgreementContract = artifacts.require("../contracts/AgreementContract.sol");

const BaseVotingContractMock = artifacts.require("../contracts/Mocks/BaseVotingContractMock.sol");
const BaseVotingCounterOfferContractMock = artifacts.require(
    "../contracts/Mocks/BaseVotingCounterOfferContractMock.sol"
);
const DilutionContract = artifacts.require("../contracts/voting/DilutionContract.Sol");
const VotingHubContract = artifacts.require("../contracts/voting/VotingHubContract.Sol");

const CrowdrecordsGovernor = artifacts.require("../contracts/governance/CrowdrecordsGovernor.sol");
const ControllerContract = artifacts.require("../contracts/ControllerContract.sol");

const {
    getEthAccount,
    VOTING_INTERVAL_BLOCKS,
    PROPOSAL_VOTING_TIME,
    GOV_VOTING_DELAY,
    GOV_VOTING_PERIOD,
    GOV_VOTING_THRESHOLD,
} = require("../test/utils/helper");

const sleep = (time) =>
    new Promise((res, rej) => {
        setTimeout(res, time);
    });

module.exports = async (deployer) => {
    await deployer.deploy(ContributionContract, await getEthAccount(0));
    let contributionContract = await ContributionContract.deployed();
    sleep(15000);
    await deployer.deploy(RecordsVotingContract, await getEthAccount(0));
    let recordsVotingContract = await RecordsVotingContract.deployed();
    sleep(15000);
    await deployer.deploy(
        RecordsContract,
        await getEthAccount(0),
        contributionContract.address,
        recordsVotingContract.address
    );
    sleep(15000);
    let recordsContract = await RecordsContract.deployed();
    await deployer.deploy(TracksContract, await getEthAccount(0));
    sleep(15000);
    let tracksContract = await TracksContract.deployed();
    await deployer.deploy(CrdTokenContract, await getEthAccount(0));
    sleep(15000);
    let crdTokenContract = await CrdTokenContract.deployed();
    await deployer.deploy(TreasuryContract, await getEthAccount(0));
    sleep(15000);
    let treasuryContract = await TreasuryContract.deployed();
    await deployer.deploy(TreasuryCoreContract, await getEthAccount(0));
    let treasuryCoreContract = await TreasuryCoreContract.deployed();
    sleep(15000);
    await deployer.deploy(
        ContributionVotingContract,
        VOTING_INTERVAL_BLOCKS,
        await getEthAccount(0)
    );
    let contributionVotingContract = await ContributionVotingContract.deployed();
    sleep(15000);
    await deployer.deploy(OrdersContract, await getEthAccount(0));
    let ordersContract = await OrdersContract.deployed();
    sleep(15000);
    await deployer.deploy(AgreementContract, VOTING_INTERVAL_BLOCKS, await getEthAccount(0));
    let agreementContract = await AgreementContract.deployed();
    sleep(15000);
    await deployer.deploy(BaseVotingContractMock, VOTING_INTERVAL_BLOCKS, await getEthAccount(0));
    let baseVotingContractMock = await BaseVotingContractMock.deployed();
    sleep(15000);
    await deployer.deploy(
        BaseVotingCounterOfferContractMock,
        VOTING_INTERVAL_BLOCKS,
        await getEthAccount(0)
    );
    let baseVotingCounterOfferContractMock = await BaseVotingCounterOfferContractMock.deployed();
    sleep(15000);
    await deployer.deploy(TreasuryCoreMockContract, await getEthAccount(0));
    let treasuryCoreMockContract = await TreasuryCoreMockContract.deployed();
    sleep(15000);
    await deployer.deploy(DilutionContract, VOTING_INTERVAL_BLOCKS, 1000, await getEthAccount(0));
    let dilutionContract = await DilutionContract.deployed();
    sleep(15000);
    await deployer.deploy(VotingHubContract, await getEthAccount(0));
    let votingHubContract = await VotingHubContract.deployed();
    sleep(15000);
    await deployer.deploy(
        CrowdrecordsGovernor,
        crdTokenContract.address,
        GOV_VOTING_DELAY,
        GOV_VOTING_PERIOD,
        GOV_VOTING_THRESHOLD
    );
    let crowdrecordsGovernor = await CrowdrecordsGovernor.deployed();
    sleep(15000);
    await deployer.deploy(
        ControllerContract,
        tracksContract.address,
        contributionContract.address,
        recordsContract.address,
        treasuryCoreContract.address
    );
    let controllerContract = await ControllerContract.deployed();

    await recordsVotingContract.initialize(
        recordsContract.address,
        treasuryContract.address,
        treasuryCoreContract.address,
        crowdrecordsGovernor.address
    );
    await contributionContract.initialize(
        contributionVotingContract.address,
        recordsContract.address,
        tracksContract.address,
        controllerContract.address
    );
    await contributionVotingContract.initialize(
        treasuryContract.address,
        contributionContract.address,
        crowdrecordsGovernor.address
    );
    await ordersContract.initialize(treasuryContract.address, treasuryCoreContract.address);
    await agreementContract.initialize(
        treasuryContract.address,
        treasuryCoreContract.address,
        crdTokenContract.address,
        crowdrecordsGovernor.address
    );
    await baseVotingContractMock.initialize(treasuryContract.address, crowdrecordsGovernor.address);
    await baseVotingCounterOfferContractMock.initialize(
        treasuryContract.address,
        crowdrecordsGovernor.address
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
        crdTokenContract.address,
        controllerContract.address
    );
    await dilutionContract.initialize(
        treasuryContract.address,
        treasuryCoreContract.address,
        crowdrecordsGovernor.address
    );
    await recordsContract.initialize(controllerContract.address);
    await tracksContract.initialize(controllerContract.address);

    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ crowdrecordsGovernor:",
        crowdrecordsGovernor.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ dilutionContract:",
        dilutionContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ votingHubContract:",
        votingHubContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ baseVotingCounterOfferContractMock:",
        baseVotingCounterOfferContractMock.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ baseVotingContractMock:",
        baseVotingContractMock.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ agreementContract:",
        agreementContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ ordersContract:",
        ordersContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ contributionVotingContract:",
        contributionVotingContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ crdTokenContract:",
        crdTokenContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ treasuryCoreContract:",
        treasuryCoreContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ treasuryContract:",
        treasuryContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ recordsVotingContract:",
        recordsVotingContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ recordsContract:",
        recordsContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ contributionContract:",
        contributionContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ tracksContract:",
        tracksContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ tracksContract:",
        controllerContract.address
    );
};

