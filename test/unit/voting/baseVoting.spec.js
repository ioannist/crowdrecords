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

    it("Creating a voting ballot, ballot win with 67%", async function() {
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
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: true });
    });

    it("Creating a voting ballot, ballot lose with 65%", async function() {
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

        await this.baseVotingContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: false });
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

    it("Moving tokens between 2 accounts after voting, should win", async function() {
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

    //Move the tokens from a to b and b to a expect the same result
    //Move all the tokens from A to B and then all B tokens to A

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
});

