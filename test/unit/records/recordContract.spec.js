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
    //// creating new record request from existing records check ballot created get voting done. perform multiple votes and win, make reward claim check if correct amount received
    //// creating new record request from existing records check ballot created get voting done. Multiple ballots and multiple claim

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

            this.oldRecordVersionOwnerRewardGovernance = await web3.utils.toWei("25000");
            this.oldRecordVersionOwnerRewardCommunity = await web3.utils.toWei("66000");

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
            const tx2 = await this.recordsVotingContract.createNewRecordVersion([
                "Test",
                "image.png",
                "Cat1",
                RECORD_ID,
                [1],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerRewardGovernance,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerRewardCommunity,
                    COMMUNITY_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
            ]);

            expectEvent(tx2, "VersionRequest", {
                requestId: "1",
            });
        });

        it("creating new record request from existing records check ballot created", async function() {
            const tx2 = await this.recordsVotingContract.createNewRecordVersion([
                "Test",
                "image.png",
                "Cat1",
                RECORD_ID,
                [1],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerRewardGovernance,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerRewardCommunity,
                    COMMUNITY_TOKEN_BALANCE_USER1,
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

            const tx2 = await this.recordsVotingContract.createNewRecordVersion([
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

            let trx3 = await this.recordsVotingContract.castVote(1, true, { from: this.user2 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: true,
            });

            trx3 = await this.recordsVotingContract.castVote(1, false, { from: this.user3 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: false,
            });
        });

        it("creating new record request from existing records check ballot created get voting done, perform multiple votes, check can only vote once", async function() {
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

            const tx2 = await this.recordsVotingContract.createNewRecordVersion([
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

            let trx3 = await this.recordsVotingContract.castVote(1, true, { from: this.user2 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: true,
            });

            trx3 = await this.recordsVotingContract.castVote(1, false, { from: this.user3 });

            await expect(
                this.recordsVotingContract.castVote(1, true, { from: this.user3 })
            ).to.eventually.be.rejectedWith("INVALID: ALREADY_VOTED");

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

            const tx2 = await this.recordsVotingContract.createNewRecordVersion([
                "Test",
                "image.png",
                "Cat1",
                RECORD_ID,
                [1],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerRewardGovernance,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerRewardCommunity,
                    COMMUNITY_TOKEN_BALANCE_USER1,
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

            let trx3 = await this.recordsVotingContract.castVote(1, false, { from: this.user2 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: false,
            });

            trx3 = await this.recordsVotingContract.castVote(1, false, { from: this.user3 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: false,
            });

            await this.recordsVotingContract.castVote(1, false, { from: this.user4 });

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            let trx4 = await this.recordsVotingContract.declareWinner(1);

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

            const tx2 = await this.recordsVotingContract.createNewRecordVersion([
                "Test",
                "image.png",
                "Cat1",
                RECORD_ID,
                [1],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerRewardGovernance,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerRewardCommunity,
                    COMMUNITY_TOKEN_BALANCE_USER1,
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

            let trx3 = await this.recordsVotingContract.castVote(1, true, { from: this.user2 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: true,
            });

            trx3 = await this.recordsVotingContract.castVote(1, true, { from: this.user3 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: true,
            });

            await this.recordsVotingContract.castVote(1, false, { from: this.user4 });

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            let trx4 = await this.recordsVotingContract.declareWinner(1, { from: this.user2 });

            await expect(
                this.treasuryCoreContract.balanceOf(
                    this.recordsVotingContract.address,
                    newGovernanceTokenId
                )
            ).to.eventually.be.bignumber.equal(new BN(this.oldRecordVersionOwnerRewardGovernance));

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

            // expectEvent(trx4, "RecordCreated", {
            //     recordId: "3",
            //     seedId: "1",
            // });
        });

        it("creating new record request from existing records check ballot created get voting done. perform multiple votes and win, make reward claim check if correct amount received", async function() {
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

            const tx2 = await this.recordsVotingContract.createNewRecordVersion([
                "Test",
                "image.png",
                "Cat1",
                RECORD_ID,
                [1],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerRewardGovernance,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
                [
                    await web3.utils.toWei("1000000"),
                    this.oldRecordVersionOwnerRewardCommunity,
                    COMMUNITY_TOKEN_BALANCE_USER1,
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

            let trx3 = await this.recordsVotingContract.castVote(1, true, { from: this.user2 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: true,
            });

            trx3 = await this.recordsVotingContract.castVote(1, true, { from: this.user3 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: true,
            });

            await this.recordsVotingContract.castVote(1, false, { from: this.user4 });

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            let trx4 = await this.recordsVotingContract.declareWinner(1, { from: this.user2 });

            await expect(
                this.treasuryCoreContract.balanceOf(
                    this.recordsVotingContract.address,
                    newGovernanceTokenId
                )
            ).to.eventually.be.bignumber.equal(new BN(this.oldRecordVersionOwnerRewardGovernance));

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

            /* expectEvent(trx4, "RecordCreated", {
                recordId: "3",
                seedId: "1",
            }); */

            // Make claims for the new tokens.
            await this.recordsVotingContract.claimNewRecordTokens(1, { from: this.user2 });
            await this.recordsVotingContract.claimNewRecordTokens(1, { from: this.user3 });
            await this.recordsVotingContract.claimNewRecordTokens(1, { from: this.user4 });

            /* expectEvent(trx4, "NewTokenClaimed", {
                versionRequestId: "1",
            });
            expectEvent(trx4, "NewTokenClaimed", {
                versionRequestId: "1",
            }); */

            // The exact amount here user2 should get is 16750 ether but due to rounding and precision
            // we get exact 16749999999999999832500 wei that is 16749.999999999999832500 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user2, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(
                new BN(web3.utils.toWei("16749.999999999999832500"))
            );
            // exact we should recive is 44220 ether
            // but due to precision we recive 44219.999999999999799000 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user2, newCommunityTokenId)
            ).to.eventually.be.bignumber.equal(
                new BN(web3.utils.toWei("44219.999999999999799000"))
            );

            // exact transfer amount 277.777 ether
            // expect 277.777777777777775000 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user3, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("277.777777777777775000")));
            // exact transfer amount 733.333 ether
            // expect 733.333333333333330000 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user3, newCommunityTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("733.333333333333330000")));

            // exact transfer amount 277.777 ether
            // expect 277.777777777777775000 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user4, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("277.777777777777775000")));
            // exact transfer amount 733.333 ether
            // expect 733.333333333333330000 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user4, newCommunityTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("733.333333333333330000")));
        });

        it("creating new record request from existing records check ballot created get voting done. Multiple ballots and multiple claim, Owner can also claim", async function() {
            let newGovernanceTokenIdFirstReq = "4";
            let newCommunityTokenIdFirstReq = "5";
            let newGovernanceTokenIdSecondReq = "6";
            let newCommunityTokenIdSecondReq = "7";

            let oldVersionCommRewardFirstReq = await web3.utils.toWei("78451");
            let oldVersionGovRewardFirstReq = await web3.utils.toWei("4451");
            let oldVersionCommRewardSecondReq = await web3.utils.toWei("47");
            let oldVersionGovRewardSecondReq = await web3.utils.toWei("7.15");

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

            let tx2 = await this.recordsVotingContract.createNewRecordVersion([
                "New Version 1",
                "image.png",
                "Cat1",
                RECORD_ID,
                [1],
                [
                    await web3.utils.toWei("1000000"),
                    oldVersionGovRewardFirstReq,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "GovernanceToken1",
                    "image.png",
                ],
                [
                    await web3.utils.toWei("1000000"),
                    oldVersionCommRewardFirstReq,
                    COMMUNITY_TOKEN_BALANCE_USER1,
                    "CommToken1",
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

            tx2 = await this.recordsVotingContract.createNewRecordVersion(
                [
                    "New Version 2",
                    "image.png",
                    "Cat1",
                    RECORD_ID,
                    [1],
                    [
                        await web3.utils.toWei("1000000"),
                        oldVersionGovRewardSecondReq,
                        GOVERNANCE_TOKEN_BALANCE_USER1,
                        "GovernanceToken2",
                        "image.png",
                    ],
                    [
                        await web3.utils.toWei("1000000"),
                        oldVersionCommRewardSecondReq,
                        COMMUNITY_TOKEN_BALANCE_USER1,
                        "CommToken2",
                        "image.png",
                    ],
                ],
                { from: this.user3 }
            );

            expectEvent(tx2, "VersionRequest", {
                requestId: "2",
                ballotId: "2",
            });

            expectEvent(tx2, "NewVersionVotingBallotCreated", {
                versionRequestId: "2",
                ballotId: "2",
            });

            let trx3 = await this.recordsVotingContract.castVote(1, true, { from: this.user2 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: true,
            });

            trx3 = await this.recordsVotingContract.castVote(1, true, { from: this.user3 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: true,
            });

            await this.recordsVotingContract.castVote(1, false, { from: this.user4 });

            trx3 = await this.recordsVotingContract.castVote(2, true, { from: this.user1 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "2",
                ballotId: "2",
                vote: true,
            });

            trx3 = await this.recordsVotingContract.castVote(2, true, { from: this.user2 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "2",
                ballotId: "2",
                vote: true,
            });

            await this.recordsVotingContract.castVote(2, false, { from: this.user4 });

            //We will check here for rejection when a user has already voted
            await expect(
                this.recordsVotingContract.castVote(2, false, { from: this.user2 })
            ).to.eventually.be.rejectedWith("INVALID: ALREADY_VOTED");

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            let trx4 = await this.recordsVotingContract.declareWinner(1, { from: this.user2 });
            expectEvent(trx4, "NewVersionTokenDistribution", {
                rewardTokenId: "4",
            });

            expectEvent(trx4, "NewVersionRequestResult", {
                versionReqId: "1",
                tokenId: "2",
                ballotId: "1",
                result: true,
            });

            trx4 = await this.recordsVotingContract.declareWinner(2, { from: this.user3 });
            expectEvent(trx4, "NewVersionTokenDistribution", {
                rewardTokenId: "6",
            });

            expectEvent(trx4, "NewVersionRequestResult", {
                versionReqId: "2",
                tokenId: "2",
                ballotId: "2",
                result: true,
            });

            await expect(
                this.treasuryCoreContract.balanceOf(
                    this.recordsVotingContract.address,
                    newGovernanceTokenIdFirstReq
                )
            ).to.eventually.be.bignumber.equal(new BN(oldVersionGovRewardFirstReq));

            await expect(
                this.treasuryCoreContract.balanceOf(
                    this.recordsVotingContract.address,
                    newCommunityTokenIdSecondReq
                )
            ).to.eventually.be.bignumber.equal(new BN(oldVersionCommRewardSecondReq));

            //The user who calls declare winner is getting the tokens that are meant for the new version owner
            await expect(
                this.treasuryCoreContract.balanceOf(this.user1, newGovernanceTokenIdFirstReq)
            ).to.eventually.be.bignumber.equal(new BN(GOVERNANCE_TOKEN_BALANCE_USER1));

            /* expectEvent(trx4, "RecordCreated", {
                recordId: "3",
                seedId: "1",
            }); */

            // Make claims for the new tokens.
            await this.recordsVotingContract.claimNewRecordTokens(1, { from: this.user1 });
            await this.recordsVotingContract.claimNewRecordTokens(1, { from: this.user2 });
            await this.recordsVotingContract.claimNewRecordTokens(1, { from: this.user3 });
            await this.recordsVotingContract.claimNewRecordTokens(1, { from: this.user4 });

            await this.recordsVotingContract.claimNewRecordTokens(2, { from: this.user3 });
            await this.recordsVotingContract.claimNewRecordTokens(2, { from: this.user1 });
            await this.recordsVotingContract.claimNewRecordTokens(2, { from: this.user2 });
            await this.recordsVotingContract.claimNewRecordTokens(2, { from: this.user4 });

            /* expectEvent(trx4, "NewTokenClaimed", {
                versionRequestId: "1",
            });
            expectEvent(trx4, "NewTokenClaimed", {
                versionRequestId: "1",
            }); */

            // Actual 52562.17 ether
            // expect 52562.169999999999832500 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user2, newCommunityTokenIdFirstReq)
            ).to.eventually.be.bignumber.equal(
                new BN(web3.utils.toWei("52562.169999999999832500"))
            );

            // Actual 2982.17 ether
            // expect 2982.169999999999966500 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user2, newGovernanceTokenIdFirstReq)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("2982.169999999999966500")));

            // Actual 0.52222222222 ether
            // expect 0.522222222222220000 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user4, newCommunityTokenIdSecondReq)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0.522222222222220000")));

            // Actual 0.07944444444 ether
            // expect 0.07944444444444 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user4, newGovernanceTokenIdSecondReq)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0.07944444444444")));
        });
    });
});

