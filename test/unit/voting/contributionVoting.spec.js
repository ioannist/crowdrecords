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
const chai = require("chai");
const BN = require("bn.js");
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const expect = chai.expect;

contract("Contribution Voting", function () {
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

    //Todo : test cases
    //Creating a voting for contribution
    //Creating a voting for contribution withour valid contribution
    //Voting for contribution without token
    //Voting for contribution successfully
    // Checking if events are emited on voting creation
    //Creating a voting for contribution
    // checking if event is emited on voting
    //checking for correct winner
    // checking for token transfer after winning
    // cheking for token status after losing

    it("Try's to vote to invalid contribution id, expect revert", async function () {
        const invalidContributionId = 3;
        await expect(
            this.contributionVotingContract.castVoteForContribution(invalidContributionId, true)
        ).to.eventually.rejectedWith("Invalid contribution id");
    });

    it("User can vote and event is emitted", async function () {
        const trx = await this.contributionVotingContract.castVoteForContribution(
            NEW_CONTRIBUTION_1_ID,
            true
        );

        expectEvent(trx, "ContributionVoting", {
            contributionId: new BN(NEW_CONTRIBUTION_1_ID),
        });
    });

    it("Cannot Vote More than once", async function () {
        await this.contributionVotingContract.castVoteForContribution(NEW_CONTRIBUTION_1_ID, true);
        await expect(
            this.contributionVotingContract.castVoteForContribution(NEW_CONTRIBUTION_1_ID, true)
        ).to.eventually.rejectedWith("You have already voted");
    });

    it("Declaring voting winner, user wins and reward amount is transferred : One Person Vote", async function () {
        await this.contributionVotingContract.castVoteForContribution(NEW_CONTRIBUTION_1_ID, true, {
            from: await helper.getEthAccount(0),
        });

        //Incrementing the blocks so that we can declare winner
        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 1);

        let tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);

        const token = await this.treasuryContract.balanceOf(
            await helper.getEthAccount(0),
            GOVERNANCE_TOKEN_ID
        );

        expectEvent(tx, "BallotResult", { result: true });

        await expect(
            this.treasuryContract.balanceOf(this.contributionOwner, COMMUNITY_TOKEN_ID)
        ).to.eventually.be.bignumber.equals(this.rewardCommunityToken);

        await expect(
            this.treasuryContract.balanceOf(this.contributionOwner, GOVERNANCE_TOKEN_ID)
        ).to.eventually.be.bignumber.equals(this.rewardGovernanceToken);
    });

    it("Declaring voting winner, user loses and reward amount is not transferred", async function () {
        await this.contributionVotingContract.castVoteForContribution(NEW_CONTRIBUTION_1_ID, false);

        //Incrementing the blocks so that we can declare winner
        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 1);

        let tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);
        expectEvent(tx, "BallotResult", { result: false });

        await expect(
            this.treasuryContract.balanceOf(this.contributionOwner, COMMUNITY_TOKEN_ID)
        ).to.eventually.be.bignumber.equals(new BN(0));

        await expect(
            this.treasuryContract.balanceOf(this.contributionOwner, GOVERNANCE_TOKEN_ID)
        ).to.eventually.be.bignumber.equals(new BN(0));
    });

    it("Declaring winner, user should win and receive the reward : Multi Person Vote", async function () {
        await this.contributionVotingContract.castVoteForContribution(NEW_CONTRIBUTION_1_ID, true);

        //Incrementing the blocks so that we can declare winner
        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 1);

        let tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);

        expectEvent(tx, "BallotResult", { result: true });

        await expect(
            this.treasuryContract.balanceOf(this.contributionOwner, COMMUNITY_TOKEN_ID)
        ).to.eventually.be.bignumber.equals(new BN(await web3.utils.toWei("1000")));

        await expect(
            this.treasuryContract.balanceOf(this.contributionOwner, GOVERNANCE_TOKEN_ID)
        ).to.eventually.be.bignumber.equals(new BN(await web3.utils.toWei("1000")));

        //Transferring governance to other account so they can vote
        await this.treasuryContract.safeTransferFrom(
            await helper.getEthAccount(0),
            await helper.getEthAccount(2),
            GOVERNANCE_TOKEN_ID,
            await web3.utils.toWei("500"),
            "0x0"
        );
        await this.treasuryContract.safeTransferFrom(
            await helper.getEthAccount(0),
            await helper.getEthAccount(3),
            GOVERNANCE_TOKEN_ID,
            await web3.utils.toWei("500"),
            "0x0"
        );

        //Here user[1] has won and owns 1000 * 10**18 tokens of governance
        //user[0] creates a new contribution and other user votes
        let newContributionId = 3;
        await this.contributionContract.createNewContribution(
            [4, 5],
            "preview.raw",
            "preview.hash",
            RECORD_ID,
            false,
            "Test description",
            this.rewardCommunityToken,
            COMMUNITY_TOKEN_ID,
            this.rewardGovernanceToken,
            GOVERNANCE_TOKEN_ID,
            {
                from: this.contributionOwner,
            }
        );

        //Has 1000 * 10**18 tokens
        await this.contributionVotingContract.castVoteForContribution(newContributionId, true, {
            from: await helper.getEthAccount(1),
        });
        //Has 500 * 10**18 tokens
        await this.contributionVotingContract.castVoteForContribution(newContributionId, true, {
            from: await helper.getEthAccount(2),
        });
        //Has 500 * 10**18 tokens
        await this.contributionVotingContract.castVoteForContribution(newContributionId, true, {
            from: await helper.getEthAccount(3),
        });

        //Incrementing the blocks so that we can declare winner
        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 1);

        tx = await this.contributionVotingContract.declareWinner(newContributionId);

        expectEvent(tx, "BallotResult", { result: false });

        //The balance of user shouldn't increase and still be as same as it was earlier
        await expect(
            this.treasuryContract.balanceOf(this.contributionOwner, COMMUNITY_TOKEN_ID)
        ).to.eventually.be.bignumber.equals(new BN(await web3.utils.toWei("1000")));

        //The balance of user shouldn't increase and still be as same as it was earlier
        await expect(
            this.treasuryContract.balanceOf(this.contributionOwner, GOVERNANCE_TOKEN_ID)
        ).to.eventually.be.bignumber.equals(new BN(await web3.utils.toWei("1000")));
    });
});

