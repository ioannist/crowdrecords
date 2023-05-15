const helper = require("../../utils/helper");
const BN = require("bn.js");
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
const CrowdrecordsGovernor = artifacts.require(
    "../../contracts/governance/CrowdrecordsGovernor.sol"
);
const ControllerContract = artifacts.require("../contracts/ControllerContract.sol");

const {
    VOTING_INTERVAL_BLOCKS,
    DILUTION_INTERVAL_BLOCKS,
    getEthAccount,
} = require("../../utils/helper");

let SEED_CONTRIBUTION_ID = 1;
let NEW_CONTRIBUTION_1_ID = 2;
let RECORD_ID = 1;
let COMMUNITY_TOKEN_ID = 2;
let GOVERNANCE_TOKEN_ID = 3;
let GOVERNANCE_TOKEN_BALANCE_USER1 = new BN("450000000000000000000000");
let COMMUNITY_TOKEN_BALANCE_USER1 = new BN("450000000000000000000000");

async function createContribution() {
    contributionOwner = await helper.getEthAccount(9);
    this.rewardCommunityToken = await web3.utils.toWei("1000");
    this.rewardGovernanceToken = await web3.utils.toWei("1000");

    await this.tracksContract.createNewTracks([["fileHash1", "fileLink1", "Category1"]]);
    await this.tracksContract.createNewTracks([["fileHash2", "fileLink2", "Category2"]]);
    await this.tracksContract.createNewTracks([["fileHash3", "fileLink3", "Category3"]]);

    await this.contributionContract.createSeedContribution(
        [
            [1, 2, 3],
            "contribution title",
            "preview.raw",
            "preview.hash",
            "This is the description for the record",
        ],
        await helper.getEthAccount(8),
        0
    );
    await this.recordsContract.createNewRecord(
        ["Test", "image.png", "Cat1", SEED_CONTRIBUTION_ID],
        await helper.getEthAccount(8),
        0,
        {
            value: 0,
        }
    );
    await this.treasuryContract.createNewCommunityToken([
        RECORD_ID,
        await web3.utils.toWei("1000000"),
        COMMUNITY_TOKEN_BALANCE_USER1,
        "Test",
        "image.png",
    ]);
    await this.treasuryContract.createNewGovernanceToken([
        RECORD_ID,
        await web3.utils.toWei("1000000"),
        GOVERNANCE_TOKEN_BALANCE_USER1,
        "Test",
        "image.png",
    ]);

    await this.tracksContract.createNewTracks([["fileHash1", "fileLink1", "Category1"]], {
        from: contributionOwner,
    });
    await this.tracksContract.createNewTracks([["fileHash2", "fileLink2", "Category2"]], {
        from: contributionOwner,
    });

    await this.contributionContract.createNewContribution(
        [
            [4, 5],
            "contribution title",
            "preview.raw",
            "preview.hash",
            RECORD_ID,
            false,
            "Test description",
            this.rewardCommunityToken,
            this.rewardGovernanceToken,
        ],
        await helper.getEthAccount(8),
        0,
        {
            from: contributionOwner,
            value: helper.VOTING_DEPOSIT_CONTRIBUTION_CONTRACT,
        }
    );
}

async function createContributionWithMockTreasury() {
    let tracksContract = await TracksContract.new();
    let contributionContract = await ContributionContract.new(await getEthAccount(0));
    let recordsVotingContract = await RecordsVotingContract.new(await getEthAccount(0));
    let recordsContract = await RecordsContract.new(
        await getEthAccount(0),
        contributionContract.address,
        recordsVotingContract.address
    );
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
    let crowdrecordsGovernor = await CrowdrecordsGovernor.new(
        crdTokenContract.address,
        helper.GOV_VOTING_DELAY,
        helper.GOV_VOTING_PERIOD,
        helper.GOV_VOTING_THRESHOLD
    );

    let controllerContract = await ControllerContract.new(
        tracksContract.address,
        contributionContract.address,
        recordsContract.address,
        treasuryContract.address
    );

    await recordsVotingContract.initialize(
        recordsContract.address,
        treasuryContract.address,
        treasuryCoreContractMock.address,
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

    await ordersContract.initialize(treasuryContract.address, treasuryCoreContractMock.address);

    await agreementContract.initialize(
        treasuryContract.address,
        treasuryCoreContractMock.address,
        crdTokenContract.address,
        crowdrecordsGovernor.address
    );

    await baseVotingContractMock.initialize(treasuryContract.address, crowdrecordsGovernor.address);
    await baseVotingCounterOfferContractMock.initialize(
        treasuryContract.address,
        crowdrecordsGovernor.address
    );

    await votingHubContract.setTreasuryCoreContractAddress(treasuryCoreContractMock.address);
    await votingHubContract.addVotingContract(contributionVotingContract.address);
    await votingHubContract.addVotingContract(agreementContract.address);
    await votingHubContract.addVotingContract(dilutionContract.address);
    await votingHubContract.addVotingContract(recordsVotingContract.address);
    await votingHubContract.addVotingContract(baseVotingContractMock.address);
    await votingHubContract.addVotingContract(baseVotingCounterOfferContractMock.address);

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
        crdTokenContract.address,
        controllerContract.address
    );

    await dilutionContract.initialize(treasuryContract.address, crowdrecordsGovernor.address);
    await recordsContract.initialize(controllerContract.address);

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
        controllerContractMock: controllerContract,
    };
}

module.exports = {
    SEED_CONTRIBUTION_ID,
    NEW_CONTRIBUTION_1_ID,
    RECORD_ID,
    COMMUNITY_TOKEN_ID,
    GOVERNANCE_TOKEN_ID,
    createContribution,
    createContributionWithMockTreasury,
};

