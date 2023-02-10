const ContributionContract = artifacts.require("../../contracts/ContributionContract.sol");
const RecordsContract = artifacts.require("../../contracts/RecordsContract.sol");
const RecordsVotingContract = artifacts.require("../../contracts/RecordsVotingContract.sol");
const TracksContract = artifacts.require("../../contracts/TracksContract.sol");
const TreasuryCoreContractMock = artifacts.require("../../contracts/TreasuryCoreContractMock.sol");
const TreasuryContract = artifacts.require("../../contracts/treasury/TreasuryContract.sol");
const CrdTokenContract = artifacts.require("../../contracts/treasury/CrdTokenContract.sol");
const ContributionVotingContract = artifacts.require(
    "../../contracts/voting/ContributionVotingContract.sol"
);
const OrdersContract = artifacts.require("../../contracts/OrdersContract.sol");
const AgreementContract = artifacts.require("../../contracts/AgreementContract.sol");

const BaseVotingContractMock = artifacts.require(
    "../../contracts/Mocks/BaseVotingContractMock.sol"
);
const BaseVotingCounterOfferContractMock = artifacts.require(
    "../../contracts/Mocks/BaseVotingCounterOfferContractMock.sol"
);

const VotingHubContract = artifacts.require("../../contracts/Mocks/VotingHubContract.sol");
const DilutionContract = artifacts.require("../../contracts/DilutionContract.sol");

const {
    VOTING_INTERVAL_BLOCKS,
    DILUTION_INTERVAL_BLOCKS,
    getEthAccount,
} = require("../../utils/helper");

async function getMockContractsForRecordTesting() {
    let tracksContract = await TracksContract.new();
    let contributionContract = await ContributionContract.new(await getEthAccount(0));
    let recordsContract = await RecordsContract.new(await getEthAccount(0));
    let recordsVotingContract = await RecordsVotingContract.new(await getEthAccount(0));
    let treasuryCoreContractMock = await TreasuryCoreContractMock.new(await getEthAccount(0));
    let treasuryContract = await TreasuryContract.new(await getEthAccount(0));
    let crdTokenContract = await CrdTokenContract.new(await getEthAccount(0));
    let contributionVotingContract = await ContributionVotingContract.new(
        VOTING_INTERVAL_BLOCKS,
        await getEthAccount(0)
    );
    let ordersContract = await OrdersContract.new(await getEthAccount(0));
    let agreementContract = await AgreementContract.new(
        VOTING_INTERVAL_BLOCKS,
        await getEthAccount(0)
    );
    let baseVotingContractMock = await BaseVotingContractMock.new(
        VOTING_INTERVAL_BLOCKS,
        await getEthAccount(0)
    );
    let baseVotingCounterOfferContractMock = await BaseVotingCounterOfferContractMock.new(
        VOTING_INTERVAL_BLOCKS,
        await getEthAccount(0)
    );
    let votingHubContract = await VotingHubContract.new(await getEthAccount(0));
    let dilutionContract = await DilutionContract.new(
        VOTING_INTERVAL_BLOCKS,
        DILUTION_INTERVAL_BLOCKS,
        await getEthAccount(0)
    );

    await recordsContract.initialize(contributionContract.address, recordsVotingContract.address);

    await recordsVotingContract.initialize(
        recordsContract.address,
        treasuryContract.address,
        treasuryCoreContractMock.address
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

    await ordersContract.initialize(treasuryContract.address, treasuryCoreContractMock.address);
    await ordersContract.setWalletAddress(await getEthAccount(9));

    await agreementContract.initialize(
        treasuryContract.address,
        treasuryCoreContractMock.address,
        crdTokenContract.address
    );

    await baseVotingContractMock.initialize(treasuryContract.address);
    await baseVotingCounterOfferContractMock.initialize(treasuryContract.address);

    await votingHubContract.setTreasuryCoreContractAddress(treasuryCoreContractMock.address);
    await votingHubContract.addVotingContract(contributionVotingContract.address);
    await votingHubContract.addVotingContract(agreementContract.address);
    await votingHubContract.addVotingContract(dilutionContract.address);
    await votingHubContract.addVotingContract(recordsVotingContract.address);

    await treasuryContract.initialize(
        treasuryCoreContractMock.address,
        recordsContract.address,
        recordsVotingContract.address,
        dilutionContract.address,
        contributionVotingContract.address
    );
    await treasuryContract.addSnapshotCaller(agreementContract.address);
    await treasuryContract.addSnapshotCaller(recordsVotingContract.address);

    await crdTokenContract.initialize(
        treasuryContract.address,
        treasuryCoreContractMock.address,
        agreementContract.address
    );

    await treasuryCoreContractMock.initialize(
        votingHubContract.address,
        treasuryContract.address,
        crdTokenContract.address
    );

    await dilutionContract.initialize(treasuryContract.address);

    return {
        tracksContractMock: tracksContract,
        contributionContractMock: contributionContract,
        recordsContractMock: recordsContract,
        recordsVotingContractMock: recordsVotingContract,
        treasuryContractMock: treasuryContract,
        treasuryCoreContractMock: treasuryCoreContractMock,
        crdTokenContractMock: crdTokenContract,
        contributionVotingContractMock: contributionVotingContract,
        ordersContractMock: ordersContract,
        agreementContractMock: agreementContract,
        baseVotingContractMock: baseVotingContractMock,
        baseVotingCounterOfferContractMock: baseVotingCounterOfferContractMock,
        votingHubContractMock: votingHubContract,
        dilutionContractMock: dilutionContract,
    };
}

module.exports = getMockContractsForRecordTesting;

