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

const { getEthAccount, VOTING_INTERVAL_BLOCKS } = require("../test/utils/helper");

module.exports = async (deployer) => {
    await deployer.deploy(ContributionContract, await getEthAccount(0));
    let contributionContract = await ContributionContract.deployed();
    await deployer.deploy(RecordsContract, await getEthAccount(0));
    let recordsContract = await RecordsContract.deployed();
    await deployer.deploy(RecordsVotingContract, await getEthAccount(0));
    let recordsVotingContract = await RecordsVotingContract.deployed();
    await deployer.deploy(TracksContract);
    let tracksContract = await TracksContract.deployed();
    await deployer.deploy(CrdTokenContract, await getEthAccount(0));
    let crdTokenContract = await CrdTokenContract.deployed();
    await deployer.deploy(TreasuryContract, await getEthAccount(0));
    let treasuryContract = await TreasuryContract.deployed();
    await deployer.deploy(TreasuryCoreContract, await getEthAccount(0));
    let treasuryCoreContract = await TreasuryCoreContract.deployed();

    await deployer.deploy(
        ContributionVotingContract,
        VOTING_INTERVAL_BLOCKS,
        await getEthAccount(0)
    );
    let contributionVotingContract = await ContributionVotingContract.deployed();

    await deployer.deploy(OrdersContract, await getEthAccount(0));
    let ordersContract = await OrdersContract.deployed();

    await deployer.deploy(AgreementContract, VOTING_INTERVAL_BLOCKS, await getEthAccount(0));
    let agreementContract = await AgreementContract.deployed();

    await deployer.deploy(BaseVotingContractMock, VOTING_INTERVAL_BLOCKS, await getEthAccount(0));
    let baseVotingContractMock = await BaseVotingContractMock.deployed();

    await deployer.deploy(
        BaseVotingCounterOfferContractMock,
        VOTING_INTERVAL_BLOCKS,
        await getEthAccount(0)
    );
    let baseVotingCounterOfferContractMock = await BaseVotingCounterOfferContractMock.deployed();

    await deployer.deploy(TreasuryCoreMockContract, await getEthAccount(0));
    let treasuryCoreMockContract = await TreasuryCoreMockContract.deployed();

    await deployer.deploy(DilutionContract, VOTING_INTERVAL_BLOCKS, 1000, await getEthAccount(0));
    let dilutionContract = await DilutionContract.deployed();
    await deployer.deploy(VotingHubContract, await getEthAccount(0));
    let votingHubContract = await VotingHubContract.deployed();
};

