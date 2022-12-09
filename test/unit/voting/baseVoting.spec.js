const setup = require("../../utils/deployContracts");
const {
    createContribution,
    createContributionWithMockTreasury,
    SEED_CONTRIBUTION_ID,
    NEW_CONTRIBUTION_1_ID,
    RECORD_ID,
    COMMUNITY_TOKEN_ID,
    GOVERNANCE_TOKEN_ID,
} = require("./createContribution");
const helper = require("../../utils/helper");
const chai = require("chai");
const BN = require("bn.js");
const chaiBN = require("chai-bn")(BN);
const chaiAsPromised = require("chai-as-promised");
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const expect = chai.expect;

contract("BaseVotingContract", function() {
    before(setup);
    before(createContribution);
    before(async function() {
        await this.votingHubContract.addVotingContract(this.baseVotingContractMock.address);
        await this.treasuryContract.addSnapshotCaller(this.baseVotingContractMock.address);
    });

    let snapShot, snapshotId;
    beforeEach(async function() {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot["result"];
    });
    afterEach(async function() {
        await helper.revertToSnapshot(snapshotId);
    });

    it("Calling snapshot function of treasury UNAUTHORIZED: ONLY_SNAPSHOT_CALLERS", async function() {
        await expect(this.treasuryContract.snapshot()).to.eventually.be.rejectedWith(
            "UNAUTHORIZED: ONLY_SNAPSHOT_CALLERS"
        );
    });

    it("Creating a voting ballot UNAUTHORIZED: OWNER_CANNOT_VOTE", async function() {
        const ballotId = 1;
        await this.baseVotingContractMock.createBallot(false, COMMUNITY_TOKEN_ID);

        await expect(
            this.baseVotingContractMock.castVote(ballotId, true)
        ).to.eventually.be.rejectedWith("UNAUTHORIZED: OWNER_CANNOT_VOTE");
    });

    it("Creating a voting ballot owner can vote", async function() {
        const ballotId = 1;
        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID);

        await this.baseVotingContractMock.castVote(ballotId, true);
    });

    it("Creating a voting ballot, single voter and declaring winner, ballot win", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, { from: user2 });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user1 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: true });
    });

    it("Creating a voting ballot, single voter and declaring winner, ballot lose", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, { from: user2 });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: false });
    });

    it("Creating a voting ballot, voting is done more than minTurnOut, ballot win with 67%", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("301500"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, { from: user2 });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", {
            ballotId: new BN(ballotId),
            result: true,
            minTurnOut: true,
        });
    });

    it("Creating a voting ballot, voting is done more than minTurnOut, ballot lose with 65%", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("292500"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, { from: user2 });

        await this.baseVotingContractMock.castVote(ballotId, false, { from: user1 });
        await this.baseVotingContractMock.castVote(ballotId, false, { from: user2 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", {
            ballotId: new BN(ballotId),
            result: false,
            minTurnOut: true,
        });
    });

    it("Creating a voting ballot, multiple voter and declaring winner, ballot win", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, { from: user2 });

        await this.baseVotingContractMock.castVote(ballotId, true);
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: true });
    });

    it("Creating a voting ballot, multiple voter and declaring winner, ballot lose", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, { from: user2 });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user2 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: false });
    });

    it("Moving tokens between 2 accounts after voting, should lose", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);
        const user4 = await helper.getEthAccount(3);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, { from: user2 });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user1 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user2 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user3 });
        await this.baseVotingContractMock.castVote(ballotId, false, { from: user4 });

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user4,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("200000"),
            "0xa165"
        );

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: false });
    });

    it("Creating a voting ballot, single vote, transfers the balance to a non-voter, less then minTurnOut vote", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);
        const user4 = await helper.getEthAccount(3);

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, { from: user2 });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user1 });

        // Transferring to a non voter
        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user4,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("448000"),
            "0xa165"
        );

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", {
            ballotId: new BN(ballotId),
            result: false,
            minTurnOut: false,
        });
    });

    it("Creating a voting ballot, multiple vote, one transfers the balance to a non-voter, less then minTurnOut vote", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);
        const user4 = await helper.getEthAccount(3);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("500"),
            "0xa165"
        );

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("500"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, { from: user2 });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user1 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user2 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user3 });

        // Transferring to a non voter
        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user4,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("448000"),
            "0xa165"
        );

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", {
            ballotId: new BN(ballotId),
            result: false,
            minTurnOut: false,
        });
    });

    it("3 voters => 1 votes yes, 2 votes no, current situation is ballot is losing. Transfer token from no voter to non-voter, new situation the yes voter weight is more than 66%, user wins.", async function() {
        const ballotId = 1;

        // 280,000 => yes
        const user1 = await helper.getEthAccount(0);
        // 20,000 => no
        const user2 = await helper.getEthAccount(1);
        // 150,000 => no, this is later transferred to non voter
        const user3 = await helper.getEthAccount(2);
        const user4 = await helper.getEthAccount(3);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("20000"),
            "0xa165"
        );

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("150000"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, { from: user2 });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user1 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user2 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user3 });

        // Transferring to a non voter
        await this.treasuryCoreContract.safeTransferFrom(
            user3,
            user4,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("150000"),
            "0xa165",
            { from: user3 }
        );

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", {
            ballotId: new BN(ballotId),
            result: true,
            minTurnOut: true,
        });
    });

    it("Try to declare winner more than once, expect revert RESULT_ALREADY_DECLARED", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("1500"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
        });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user2 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", {
            ballotId: new BN(ballotId),
            result: false,
            minTurnOut: false,
        });

        await expect(
            this.baseVotingContractMock.declareWinner(ballotId)
        ).to.eventually.be.rejectedWith("RESULT_ALREADY_DECLARED");
    });

    it("Try to vote on expired ballot, expect revert VOTING_TIME_OVER", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("1500"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
        });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user2 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        await expect(
            this.baseVotingContractMock.castVote(ballotId, true, { from: user1 })
        ).to.eventually.be.rejectedWith("VOTING_TIME_OVER");
    });

    it("Try to vote twice, expect revert ALREADY_VOTED", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("1500"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
        });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user2 });

        await expect(
            this.baseVotingContractMock.castVote(ballotId, true, { from: user2 })
        ).to.eventually.be.rejectedWith("ALREADY_VOTED");
    });

    it("Try to vote on already declared ballot, expect revert VOTING_TIME_OVER", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("1500"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
        });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user2 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", {
            ballotId: new BN(ballotId),
            result: false,
            minTurnOut: false,
        });

        await expect(
            this.baseVotingContractMock.castVote(ballotId, true, { from: user1 })
        ).to.eventually.be.rejectedWith("VOTING_TIME_OVER");
    });

    it("Try to declared ballot before voting time is completed, expect revert VOTING_TIME_NOT_OVER", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("1500"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
        });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user2 });

        await expect(
            this.baseVotingContractMock.declareWinner(ballotId)
        ).to.eventually.be.rejectedWith("VOTING_TIME_NOT_OVER");
    });

    it("Moving tokens between 2 accounts after ballot expired, tokens are transferred and minTurnOut ratio is not meet should win", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);
        const user4 = await helper.getEthAccount(3);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("500"),
            "0xa165"
        );

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("500"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, { from: user2 });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user1 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user2 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user4,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("448000"),
            "0xa165"
        );

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: true });
    });

    it("Moving tokens between 2 accounts after ballot expired, should win", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);
        const user4 = await helper.getEthAccount(3);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, { from: user2 });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user1 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user2 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user4,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("200000"),
            "0xa165"
        );

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: true });
    });

    it("Moving tokens between 2 accounts after ballot expired, should lose", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);
        const user4 = await helper.getEthAccount(3);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user4,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, { from: user2 });

        await this.baseVotingContractMock.castVote(ballotId, false, { from: user1 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user4 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user2 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user4,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("300000"),
            "0xa165"
        );

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: false });
    });

    it("Moving tokens between 2 accounts after voting and before result declaring, should win", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);
        const user4 = await helper.getEthAccount(3);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user4,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, { from: user2 });

        await this.baseVotingContractMock.castVote(ballotId, false, { from: user1 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user4 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user2 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user3 });

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user4,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("300000"),
            "0xa165"
        );

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: true });
    });

    it("Moving tokens between 2 accounts after voting and before result declaring, should lose", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);
        const user4 = await helper.getEthAccount(3);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user4,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, { from: user2 });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user1 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user2 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user3 });
        await this.baseVotingContractMock.castVote(ballotId, false, { from: user4 });

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user4,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("300000"),
            "0xa165"
        );

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: false });
    });

    it("Move all the tokens from A to B and then all B tokens to A, expect same result, should win", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, { from: user2 });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user1 });
        await this.baseVotingContractMock.castVote(ballotId, false, { from: user2 });

        //Transferring tokens from user 1 into user 2
        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("300000"),
            "0xa165"
        );

        //Transferring tokens from user 2 into user 1
        //The output should now again change to winning of ballot
        await this.treasuryCoreContract.safeTransferFrom(
            user2,
            user1,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("300000"),
            "0xa165",
            { from: user2 }
        );

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: true });
    });

    it("Creating a voting ballot, single vote, less then minTurnOut vote", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("1500"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
        });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", {
            ballotId: new BN(ballotId),
            result: false,
            minTurnOut: false,
        });
    });

    it("Creating a voting ballot, multiple vote, less then minTurnOut vote", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("1500"),
            "0xa165"
        );
        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("100"),
            "0xa165"
        );

        await this.baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
        });

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user2 });
        await this.baseVotingContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", {
            ballotId: new BN(ballotId),
            result: false,
            minTurnOut: false,
        });
    });

    it("Create vote, multiple vote, tokens are diluted and transfer it to non-voter, now the minTurnOut is not meet due to high token dilution", async function() {
        const {
            treasuryCoreContractMock,
            baseVotingContractMock,
        } = await createContributionWithMockTreasury();

        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        const ballotId = 1;
        const tokenId = 1;
        await treasuryCoreContractMock.mintTokensForMe(tokenId, await web3.utils.toWei("450000"), {
            from: user1,
        });
        await treasuryCoreContractMock.mintTokensForMe(tokenId, await web3.utils.toWei("49000"), {
            from: user2,
        });
        await treasuryCoreContractMock.mintTokensForMe(tokenId, await web3.utils.toWei("1000"), {
            from: user3,
        });

        await baseVotingContractMock.createBallot(true, COMMUNITY_TOKEN_ID, { from: user2 });

        // Here we are voting from 2 accounts and the minTurnOut is matched
        await baseVotingContractMock.castVote(ballotId, true, { from: user2 });
        await baseVotingContractMock.castVote(ballotId, true, { from: user3 });

        // Here we mint new tokens and then transfer it to user1 who is a non voter, now the minTurnOut is not matched
        await treasuryCoreContractMock.mintTokensForMe(tokenId, await web3.utils.toWei("550000"));

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: false });
    });
});

