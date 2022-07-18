const setup = require("../../utils/deployContracts");
const helper = require("../../utils/helper");
const chai = require("chai");
const BN = require("bn.js");
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const chaiBN = require("chai-bn")(BN);
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

contract("Contribution Contract", function () {
    let SEED_CONTRIBUTION_ID = 1;
    let NEW_CONTRIBUTION_1_ID = 2;
    let RECORD_ID = 1;
    let COMMUNITY_TOKEN_ID = 2;
    let GOVERNANCE_TOKEN_ID = 3;
    let GOVERNANCE_TOKEN_BALANCE_USER1;
    let COMMUNITY_TOKEN_BALANCE_USER1;

    let contributionOwner;
    let rewardCommunityToken;
    let rewardGovernanceToken;

    before(setup);
    before(async function () {
        GOVERNANCE_TOKEN_BALANCE_USER1 = await web3.utils.toWei("450000");
        COMMUNITY_TOKEN_BALANCE_USER1 = await web3.utils.toWei("450000");

        contributionOwner = await helper.getEthAccount(9);
        rewardCommunityToken = await web3.utils.toWei("1000");
        rewardGovernanceToken = await web3.utils.toWei("1000");
    });

    let snapShot, snapshotId;
    beforeEach(async function () {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot["result"];
    });
    afterEach(async function () {
        await helper.revertToSnapshot(snapshotId);
    });

    it("Creating a seed contribution", async function () {
        const tx = await this.contributionContract.createSeedContribution(
            [1, 2, 3],
            "preview.raw",
            "preview.hash",
            "This is the description for the record"
        );

        expectEvent(tx, "ContributionCreated", {
            contributionId: "1",
            recordId: "0",
        });
    });

    it("Creating seed contribution and record", async function () {
        //seed contribution id 1
        await this.contributionContract.createSeedContribution(
            [1, 2, 3],
            "preview.raw",
            "preview.hash",
            "This is the description for the record 1"
        );
        const tx = await this.recordsContract.createNewRecord(
            "Test",
            "image.png",
            "Cat1",
            SEED_CONTRIBUTION_ID
        );
        expectEvent(tx, "RecordCreated", {
            seedId: "1",
        });
    });

    context("Testing contribution voting", function () {
        let snapShot2, snapshotId2;
        beforeEach(async function () {
            snapShot2 = await helper.takeSnapshot();
            snapshotId2 = snapShot2["result"];

            await this.contributionContract.createSeedContribution(
                [1, 2, 3],
                "preview.raw",
                "preview.hash",
                "This is the description for the record"
            );
            await this.recordsContract.createNewRecord(
                "Test",
                "image.png",
                "Cat1",
                SEED_CONTRIBUTION_ID
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
            await this.contributionContract.createNewContribution(
                [4, 5],
                "preview.raw",
                "preview.hash",
                RECORD_ID,
                false,
                "Test description",
                rewardCommunityToken,
                rewardGovernanceToken,
                {
                    from: contributionOwner,
                }
            );
        });
        afterEach(async function () {
            await helper.revertToSnapshot(snapshotId2);
        });

        it("Tries to vote to invalid contribution id, expect revert", async function () {
            const invalidContributionId = 3;
            await expect(
                this.contributionVotingContract.castVoteForContribution(invalidContributionId, true)
            ).to.eventually.be.rejectedWith("Invalid contribution id");
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
            await this.contributionVotingContract.castVoteForContribution(
                NEW_CONTRIBUTION_1_ID,
                true
            );
            await expect(
                this.contributionVotingContract.castVoteForContribution(NEW_CONTRIBUTION_1_ID, true)
            ).to.eventually.be.rejectedWith("You have already voted");
        });

        it("Declaring voting winner, user wins and reward amount is transferred : One Person Vote", async function () {
            await this.contributionVotingContract.castVoteForContribution(
                NEW_CONTRIBUTION_1_ID,
                true,
                {
                    from: await helper.getEthAccount(0),
                }
            );

            //Incrementing the blocks so that we can declare winner
            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 1);

            let tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);

            const token = await this.treasuryContract.balanceOf(
                await helper.getEthAccount(0),
                GOVERNANCE_TOKEN_ID
            );

            expectEvent(tx, "BallotResult", { result: true });

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(rewardCommunityToken);

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(rewardGovernanceToken);
        });

        it("Declaring voting winner, user loses and reward amount is not transferred", async function () {
            await this.contributionVotingContract.castVoteForContribution(
                NEW_CONTRIBUTION_1_ID,
                false
            );

            //Incrementing the blocks so that we can declare winner
            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 1);

            let tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);
            expectEvent(tx, "BallotResult", { result: false });

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(new BN(0));

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(new BN(0));
        });

        it("Declaring winner, user should win and receive the reward : Multi Person Vote", async function () {
            await this.contributionVotingContract.castVoteForContribution(
                NEW_CONTRIBUTION_1_ID,
                true
            );

            //Incrementing the blocks so that we can declare winner
            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 1);

            let tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);

            expectEvent(tx, "BallotResult", { result: true });

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(new BN(await web3.utils.toWei("1000")));

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, GOVERNANCE_TOKEN_ID)
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
                rewardCommunityToken,
                rewardGovernanceToken,
                {
                    from: contributionOwner,
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
                this.treasuryContract.balanceOf(contributionOwner, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(new BN(await web3.utils.toWei("1000")));

            //The balance of user shouldn't increase and still be as same as it was earlier
            await expect(
                this.treasuryContract.balanceOf(contributionOwner, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(new BN(await web3.utils.toWei("1000")));
        });
    });
});

