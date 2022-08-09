const ContributionContract = artifacts.require("../contracts/ContributionContract.sol");
const RecordsContract = artifacts.require("../contracts/RecordsContract.sol");
const TracksContract = artifacts.require("../contracts/TracksContract.sol");
const TreasuryContract = artifacts.require("../contracts/TreasuryContract.sol");
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

    await deployer.deploy(AgreementContract, 20);
    let agreementContract = await AgreementContract.deployed();

    await deployer.deploy(BaseVotingContractMock, 20);
    let baseVotingContractMock = await BaseVotingContractMock.deployed();
    await deployer.deploy(BaseVotingCounterOfferContractMock, 20);
    let baseVotingCounterOfferContractMock = await BaseVotingCounterOfferContractMock.deployed();

    await deployer.deploy(DilutionContract, 20, 1000);
    let dilutionContract = await DilutionContract.deployed();
    await deployer.deploy(VotingHubContract);
    let votingHubContract = await VotingHubContract.deployed();
};

