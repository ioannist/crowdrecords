const setup = require("../../utils/deployContracts");
const {
    createContribution,
    SEED_CONTRIBUTION_ID,
    NEW_CONTRIBUTION_1_ID,
    RECORD_ID,
    COMMUNITY_TOKEN_ID,
    GOVERNANCE_TOKEN_ID,
} = require("./createContribution");
const timeMachine = require("../../utils/helper");
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
        snapShot = await timeMachine.takeSnapshot();
        snapshotId = snapShot["result"];
    });
    afterEach(async function () {
        await timeMachine.revertToSnapshot(snapshotId);
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

    it("Declaring voting winner and reward amount is transferred", async function () {
        await this.contributionVotingContract.castVoteForContribution(NEW_CONTRIBUTION_1_ID, true);

        //Incrementing the blocks so that we can declare winner
        await advanceMultipleBlocks(VOTING_INTERVAL_BLOCKS + 1);

        const tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);

        checkIfEventEmitted(tx?.logs, "BallotResult", "BallotResult event not generated");
        checkIfEventData(tx?.logs, "BallotResult", "BallotResult event error", { result: true });
    });
});

