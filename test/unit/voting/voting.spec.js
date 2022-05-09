const setup = require("../../utils/deployContracts");
const {
    createContribution,
    SEED_CONTRIBUTION_ID,
    NEW_CONTRIBUTION_1_ID,
    RECORD_ID,
    COMMUNITY_TOKEN_ID,
    GOVERNANCE_TOKEN_ID,
} = require("./createContribution");
const helper = require("../../utils/helper");
let tryCatch = require("../../utils/exception").tryCatch;
let errTypes = require("../../utils/exception").errTypes;
let {
    checkIfEventEmitted,
    advanceMultipleBlocks,
    checkIfEventData,
    VOTING_INTERVAL_BLOCKS,
} = require("../../utils/helper");

contract("Voting", function () {
    before(setup);
    before(createContribution);

    let snapShot, snapshotId;
    beforeEach(async function () {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot["result"];
    });
    afterEach(async function () {
        await helper.revertToSnapshot(snapshotId);
    });

    it("User can vote and event is emitted", async function () {
        const trx = await this.contributionVotingContract.castVoteForContribution(
            NEW_CONTRIBUTION_1_ID,
            true
        );

        checkIfEventEmitted(
            trx?.logs,
            "ContributionVoting",
            "ContributionVoting event not generated"
        );
    });

    it("Cannot Vote More than once", async function () {
        await this.contributionVotingContract.castVoteForContribution(NEW_CONTRIBUTION_1_ID, true);
        await tryCatch(
            this.contributionVotingContract.castVoteForContribution(NEW_CONTRIBUTION_1_ID, true)
        );
    });

    it("Declaring voting winner, user wins and reward amount is transferred : One Person Vote", async function () {
        await this.contributionVotingContract.castVoteForContribution(NEW_CONTRIBUTION_1_ID, true);

        //Incrementing the blocks so that we can declare winner
        await advanceMultipleBlocks(VOTING_INTERVAL_BLOCKS + 1);

        let tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);

        checkIfEventEmitted(tx?.logs, "BallotResult", "BallotResult event not generated");
        checkIfEventData(tx?.logs, "BallotResult", "BallotResult event error", { result: true });

        //Checking if the balance was actually transferd
        tx = await this.treasuryContract.balanceOf(
            await helper.getEthAccount(1),
            COMMUNITY_TOKEN_ID
        );
        assert(tx == 1000, "Community tokens transfer was not successful");

        tx = await this.treasuryContract.balanceOf(
            await helper.getEthAccount(1),
            GOVERNANCE_TOKEN_ID
        );
        assert(tx == 1000, "Governance token transfer was not successful");
    });

    it("Declaring voting winner, user loses and reward amount is not transferred", async function () {
        await this.contributionVotingContract.castVoteForContribution(NEW_CONTRIBUTION_1_ID, false);

        //Incrementing the blocks so that we can declare winner
        await advanceMultipleBlocks(VOTING_INTERVAL_BLOCKS + 1);

        let tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);

        checkIfEventEmitted(tx?.logs, "BallotResult", "BallotResult event not generated");
        checkIfEventData(tx?.logs, "BallotResult", "BallotResult event error", { result: false });

        //Checking if the balance was actually transferd
        tx = await this.treasuryContract.balanceOf(
            await helper.getEthAccount(1),
            COMMUNITY_TOKEN_ID
        );
        assert(tx == 0, "Community tokens transfer was not successful");

        tx = await this.treasuryContract.balanceOf(
            await helper.getEthAccount(1),
            GOVERNANCE_TOKEN_ID
        );
        assert(tx == 0, "Governance token transfer was not successful");
    });

    it("Declaring winner, user should win and the creator of contribution's token are ignored in voting result : Multi Person Vote", async function () {
        await this.contributionVotingContract.castVoteForContribution(NEW_CONTRIBUTION_1_ID, true);

        //Incrementing the blocks so that we can declare winner
        await advanceMultipleBlocks(VOTING_INTERVAL_BLOCKS + 1);

        let tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);

        checkIfEventEmitted(tx?.logs, "BallotResult", "BallotResult event not generated");
        checkIfEventData(tx?.logs, "BallotResult", "BallotResult event error", { result: true });

        //Checking if the balance was actually transferd
        tx = await this.treasuryContract.balanceOf(
            await helper.getEthAccount(1),
            COMMUNITY_TOKEN_ID
        );
        assert(tx == 1000, "Community tokens transfer was not successful");

        tx = await this.treasuryContract.balanceOf(
            await helper.getEthAccount(1),
            GOVERNANCE_TOKEN_ID
        );
        assert(tx == 1000, "Governance token transfer was not successful");

        //Transferring governance to other account so they can vote
        await this.treasuryContract.safeTransferFrom(
            await helper.getEthAccount(0),
            await helper.getEthAccount(2),
            GOVERNANCE_TOKEN_ID,
            500,
            "0x0"
        );
        await this.treasuryContract.safeTransferFrom(
            await helper.getEthAccount(0),
            await helper.getEthAccount(3),
            GOVERNANCE_TOKEN_ID,
            500,
            "0x0"
        );

        //Here user[1] has won and owns 1000 tokens of governance
        //user[0] creates a new contribution and other user votes
        let newContributionId = 3;
        await this.contributionContract.createNewContribution(
            [4, 5],
            "preview.raw",
            "preview.hash",
            RECORD_ID,
            false,
            "Test description",
            1000,
            COMMUNITY_TOKEN_ID,
            1000,
            GOVERNANCE_TOKEN_ID
        );

        //Has 1000 tokens
        await this.contributionVotingContract.castVoteForContribution(newContributionId, true, {
            from: await helper.getEthAccount(1),
        });
        //Has 500 tokens
        await this.contributionVotingContract.castVoteForContribution(newContributionId, true, {
            from: await helper.getEthAccount(2),
        });
        //Has 500 tokens
        await this.contributionVotingContract.castVoteForContribution(newContributionId, true, {
            from: await helper.getEthAccount(3),
        });

        //Incrementing the blocks so that we can declare winner
        await advanceMultipleBlocks(VOTING_INTERVAL_BLOCKS + 1);

        tx = await this.contributionVotingContract.declareWinner(newContributionId);

        checkIfEventEmitted(tx?.logs, "BallotResult", "BallotResult event not generated");
        checkIfEventData(
            tx?.logs,
            "BallotResult",
            "BallotResult event doesn't match the requirement",
            { result: true }
        );
    });
});

