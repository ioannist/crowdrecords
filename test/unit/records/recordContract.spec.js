const setup = require("../../utils/deployContracts");
const helper = require("../../utils/helper");
const chai = require("chai");
const BN = require("bn.js");
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const { expectRevert } = require("@openzeppelin/test-helpers");
const chaiAsPromised = require("chai-as-promised");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
chai.use(chaiAsPromised);
const expect = chai.expect;

contract("Records Contract", function() {
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
    before(async () => {
        GOVERNANCE_TOKEN_BALANCE_USER1 = await web3.utils.toWei("450000");
        COMMUNITY_TOKEN_BALANCE_USER1 = await web3.utils.toWei("450000");

        contributionOwner = await helper.getEthAccount(9);
        rewardCommunityToken = await web3.utils.toWei("1000");
        rewardGovernanceToken = await web3.utils.toWei("1000");
    });

    let snapShot, snapshotId;
    beforeEach(async function() {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot["result"];
    });
    afterEach(async function() {
        await helper.revertToSnapshot(snapshotId);
    });

    //// creating new record request from existing records
    //// creating new record request from existing records check ballot created
    //// creating new record request from existing records check ballot created get voting done, perform multiple votes
    //// creating new record request from existing records check ballot created get voting done. perform multiple votes and lose
    //// creating new record request from existing records check ballot created get voting done. perform multiple votes and win
    // creating new record request from existing records check ballot created get voting done. perform multiple votes and win, make reward claim check if correct amount received
    // creating new record request from existing records check ballot created get voting done. perform multiple votes and win, try to make multiple reward claim

    it("Creating seed contribution and record", async function() {
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

    it("Creating record with invalid seed contribution Id, expect revert", async function() {
        await expect(
            this.recordsContract.createNewRecord("Test", "image.png", "Cat1", 3)
        ).to.eventually.rejectedWith("INVALID: CONTRIBUTION_NOT_FOUND");
    });

    it("Creating a normal contribution and try to create record with it, expect reject", async function() {
        //seed contribution id 1
        await this.contributionContract.createSeedContribution(
            [1, 2, 3],
            "preview.raw",
            "preview.hash",
            "This is the description for the record 1"
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

        //this contribution will have id of 2
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

        await expect(
            this.recordsContract.createNewRecord("Test", "image.png", "Cat1", 2)
        ).to.eventually.rejectedWith("INVALID: NOT_SEED_CONTRIBUTION");
    });

    context("New Record Version", function() {
        let snapShot2, snapshotId2;
        beforeEach(async function() {
            snapShot2 = await helper.takeSnapshot();
            snapshotId2 = snapShot2["result"];

            this.oldRecordVersionOwnerReward = await web3.utils.toWei("25000");

            this.user1 = await helper.getEthAccount(0);
            this.user2 = await helper.getEthAccount(1);
            this.user3 = await helper.getEthAccount(2);
            this.user4 = await helper.getEthAccount(3);

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

            //this contribution will have id of 2
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
        afterEach(async function() {
            await helper.revertToSnapshot(snapshotId2);
        });

        it("Creating a new record version request, VersionRequest event emitted", async function() {
            const tx2 = await this.recordsContract.createNewRecordVersion([
                "Test",
                "image.png",
                "Cat1",
                RECORD_ID,
                [1],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerReward,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerReward,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
            ]);

            expectEvent(tx2, "VersionRequest", {
                requestId: "1",
            });
        });

        it("creating new record request from existing records check ballot created", async function() {
            const tx2 = await this.recordsContract.createNewRecordVersion([
                "Test",
                "image.png",
                "Cat1",
                RECORD_ID,
                [1],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerReward,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerReward,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
            ]);

            expectEvent(tx2, "VersionRequest", {
                requestId: "1",
            });

            expectEvent(tx2, "NewVersionVotingBallotCreated", {
                versionRequestId: "1",
                ballotId: "1",
            });
        });

        it("creating new record request from existing records check ballot created get voting done, perform multiple votes, generates event", async function() {
            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("301500"),
                "0xa165"
            );
            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user3,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0xa165"
            );
            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user4,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0xa165"
            );

            const tx2 = await this.recordsContract.createNewRecordVersion([
                "Test",
                "image.png",
                "Cat1",
                RECORD_ID,
                [1],
                [
                    await web3.utils.toWei("1000000"),
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
                [
                    await web3.utils.toWei("1000000"),
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
            ]);

            expectEvent(tx2, "VersionRequest", {
                requestId: "1",
                ballotId: "1",
            });

            expectEvent(tx2, "NewVersionVotingBallotCreated", {
                versionRequestId: "1",
                ballotId: "1",
            });

            let trx3 = await this.recordsContract.castVote(1, true, { from: this.user2 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: true,
            });

            trx3 = await this.recordsContract.castVote(1, false, { from: this.user3 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: false,
            });
        });

        it("creating new record request from existing records check ballot created get voting done. perform multiple votes and lose", async function() {
            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("301500"),
                "0xa165"
            );
            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user3,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0xa165"
            );
            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user4,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0xa165"
            );

            const tx2 = await this.recordsContract.createNewRecordVersion([
                "Test",
                "image.png",
                "Cat1",
                RECORD_ID,
                [1],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerReward,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerReward,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
            ]);

            expectEvent(tx2, "VersionRequest", {
                requestId: "1",
                ballotId: "1",
            });

            expectEvent(tx2, "NewVersionVotingBallotCreated", {
                versionRequestId: "1",
                ballotId: "1",
            });

            let trx3 = await this.recordsContract.castVote(1, false, { from: this.user2 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: false,
            });

            trx3 = await this.recordsContract.castVote(1, false, { from: this.user3 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: false,
            });

            await this.recordsContract.castVote(1, false, { from: this.user4 });

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            let trx4 = await this.recordsContract.declareWinner(1);

            expectEvent(trx4, "NewVersionRequestResult", {
                versionReqId: "1",
                tokenId: "2",
                ballotId: "1",
                result: false,
            });
        });

        it("creating new record request from existing records check ballot created get voting done. perform multiple votes and win", async function() {
            let newGovernanceTokenId = "4";
            let newCommunityTokenId = "5";

            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("301500"),
                "0xa165"
            );
            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user3,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0xa165"
            );
            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user4,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0xa165"
            );

            const tx2 = await this.recordsContract.createNewRecordVersion([
                "Test",
                "image.png",
                "Cat1",
                RECORD_ID,
                [1],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerReward,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerReward,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
            ]);

            expectEvent(tx2, "VersionRequest", {
                requestId: "1",
                ballotId: "1",
            });

            expectEvent(tx2, "NewVersionVotingBallotCreated", {
                versionRequestId: "1",
                ballotId: "1",
            });

            let trx3 = await this.recordsContract.castVote(1, true, { from: this.user2 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: true,
            });

            trx3 = await this.recordsContract.castVote(1, true, { from: this.user3 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: true,
            });

            await this.recordsContract.castVote(1, false, { from: this.user4 });

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            let trx4 = await this.recordsContract.declareWinner(1, { from: this.user2 });

            await expect(
                this.treasuryCoreContract.balanceOf(
                    this.recordsContract.address,
                    newGovernanceTokenId
                )
            ).to.eventually.be.bignumber.equal(new BN(this.oldRecordVersionOwnerReward));

            //The user who calls declare winner is getting the tokens that are meant for the new version owner
            await expect(
                this.treasuryCoreContract.balanceOf(this.user1, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("450000")));

            expectEvent(trx4, "NewVersionTokenDistribution", {
                rewardTokenId: "4",
            });

            expectEvent(trx4, "NewVersionRequestResult", {
                versionReqId: "1",
                tokenId: "2",
                ballotId: "1",
                result: true,
            });

            expectEvent(trx4, "RecordCreated", {
                recordId: "3",
                seedId: "1",
            });
        });
    });
});

