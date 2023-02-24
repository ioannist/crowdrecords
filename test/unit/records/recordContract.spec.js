const setup = require("../../utils/deployContracts");
const getMockContractsForRecordTesting = require("./deployMockContracts");
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
    async function createTrack(tracksContract, owner) {
        const tx = await tracksContract.createNewTrack("fileHash", "fileLink", "Category", {
            from: owner,
        });
        await expectEvent(tx, "TrackCreated", {
            filehash: "fileHash",
            filelink: "fileLink",
            category: "Category",
        });
    }

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

    it("Creating seed contribution and record", async function() {
        const user1 = await helper.getEthAccount(0);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        //seed contribution id 1
        await this.contributionContract.createSeedContribution(
            [1, 2, 3],
            "contribution title",
            "preview.raw",
            "preview.hash",
            "This is the description for the record 1",
            { from: user1 }
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
        const user1 = await helper.getEthAccount(0);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);

        //seed contribution id 1
        await this.contributionContract.createSeedContribution(
            [1, 2, 3],
            "contribution title",
            "preview.raw",
            "preview.hash",
            "This is the description for the record 1",
            { from: user1 }
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

        await createTrack(this.tracksContract, contributionOwner);
        await createTrack(this.tracksContract, contributionOwner);

        //this contribution will have id of 2
        await this.contributionContract.createNewContribution(
            [4, 5],
            "contribution title",
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

    it("User create seed contribution, creates new record, tries to create one more record with same see but rejected", async function() {
        const user1 = await helper.getEthAccount(0);

        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        //seed contribution id 1
        await this.contributionContract.createSeedContribution(
            [1, 2, 3],
            "contribution title",
            "preview.raw",
            "preview.hash",
            "This is the description for the record 1",
            { from: user1 }
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

        await expect(
            this.recordsContract.createNewRecord("Test", "image.png", "Cat1", SEED_CONTRIBUTION_ID)
        ).to.eventually.be.rejectedWith("INVALID: SEED_ALREADY_USED");
    });
    it("User create seed contribution, creates new record, tries to create one more record with same see but rejected", async function() {
        const user1 = await helper.getEthAccount(0);

        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        //seed contribution id 1
        await this.contributionContract.createSeedContribution(
            [1, 2, 3],
            "contribution title",
            "preview.raw",
            "preview.hash",
            "This is the description for the record 1",
            { from: user1 }
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

        await expect(
            this.recordsContract.createNewRecord("Test", "image.png", "Cat1", SEED_CONTRIBUTION_ID)
        ).to.eventually.be.rejectedWith("INVALID: SEED_ALREADY_USED");
    });
    it("User create seed contribution, different user tries to create rejected. (only the same user should be able to create new record, incase of new version anyone can create it", async function() {
        let user2 = await helper.getEthAccount(1);
        const user1 = await helper.getEthAccount(0);

        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        //seed contribution id 1
        await this.contributionContract.createSeedContribution(
            [1, 2, 3],
            "contribution title",
            "preview.raw",
            "preview.hash",
            "This is the description for the record 1",
            { from: user1 }
        );

        await expect(
            this.recordsContract.createNewRecord(
                "Test",
                "image.png",
                "Cat1",
                SEED_CONTRIBUTION_ID,
                { from: user2 }
            )
        ).to.eventually.be.rejectedWith("INVALID: ONLY_CONTRIBUTION_OWNER");
    });
    it("Mashing up the orders of the creation of record, expect rejection", async function() {
        // Try to create a record without seed contribution, will receive rejection
        await expect(
            this.recordsContract.createNewRecord("Test", "image.png", "Cat1", SEED_CONTRIBUTION_ID)
        ).to.eventually.be.rejectedWith("INVALID: CONTRIBUTION_NOT_FOUND");

        const user1 = await helper.getEthAccount(0);

        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);

        // seed contribution id 1
        // Now we have created a seed contribution
        await this.contributionContract.createSeedContribution(
            [1, 2, 3],
            "contribution title",
            "preview.raw",
            "preview.hash",
            "This is the description for the record 1",
            { from: user1 }
        );

        // Trying to create the community and governance token for the record, before record is created
        await expect(
            this.treasuryContract.createNewCommunityToken([
                RECORD_ID,
                await web3.utils.toWei("1000000"),
                COMMUNITY_TOKEN_BALANCE_USER1,
                "Test",
                "image.png",
            ])
        ).to.eventually.be.rejectedWith("INVALID: ONLY_RECORD_OWNER");
        await expect(
            this.treasuryContract.createNewGovernanceToken([
                RECORD_ID,
                await web3.utils.toWei("1000000"),
                GOVERNANCE_TOKEN_BALANCE_USER1,
                "Test",
                "image.png",
            ])
        ).to.eventually.be.rejectedWith("INVALID: ONLY_RECORD_OWNER");

        // Continuing normal flow, create record from already created seed and then create tokens.
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

        await createTrack(this.tracksContract, contributionOwner);
        await createTrack(this.tracksContract, contributionOwner);

        //this contribution will have id of 2
        await this.contributionContract.createNewContribution(
            [4, 5],
            "contribution title",
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

    it("Person who creates contribution needs to own the tracks are being used.", async function() {
        const user1 = await helper.getEthAccount(0);

        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await expect(
            this.contributionContract.createSeedContribution(
                [1, 2, 3],
                "contribution title",
                "preview.raw",
                "preview.hash",
                "This is the description for the record 1",
                { from: await helper.getEthAccount(2) }
            )
        ).to.eventually.be.rejectedWith("INVALID: NOT_A_TRACK_OWNER");
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

            await createTrack(this.tracksContract, this.user1);
            await createTrack(this.tracksContract, this.user1);
            await createTrack(this.tracksContract, this.user1);
            //seed contribution id 1
            await this.contributionContract.createSeedContribution(
                [1, 2, 3],
                "contribution title",
                "preview.raw",
                "preview.hash",
                "This is the description for the record 1",
                { from: this.user1 }
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

            await createTrack(this.tracksContract, contributionOwner);
            await createTrack(this.tracksContract, contributionOwner);

            //this contribution will have id of 2
            await this.contributionContract.createNewContribution(
                [4, 5],
                "contribution title",
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

            //The owner of the new version request gets his tokens.
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

            //The owner of the new version request gets his tokens.
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
            // exact we should receive is 44220 ether
            // but due to precision we receive 44219.999999999999799000 ether
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

            //The owner of the new version request gets his tokens.
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

        it("Voting check, some votes are performed before expiry of ballot and some of them are performed after expiry, expecting rejection for after expiry", async function() {
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

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            let trx4 = await this.recordsVotingContract.declareWinner(1);

            expectEvent(trx4, "NewVersionRequestResult", {
                versionReqId: "1",
                tokenId: "2",
                ballotId: "1",
                result: false,
            });

            await expect(
                this.recordsVotingContract.castVote(1, false, { from: this.user4 })
            ).to.eventually.be.rejectedWith("INVALID: VOTING_TIME_OVER");
        });

        it("check for case where user provides with more reward then total minting amount / treasury amount, expect revert", async function() {
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

            // Here the tokens for user is more than the total mint amount
            await expect(
                this.recordsVotingContract.createNewRecordVersion([
                    "Test",
                    "image.png",
                    "Cat1",
                    RECORD_ID,
                    [1],
                    [
                        await web3.utils.toWei("1000000"),
                        this.oldRecordVersionOwnerRewardGovernance,
                        await web3.utils.toWei("10000000"),
                        "Test",
                        "image.png",
                    ],
                    [
                        await web3.utils.toWei("1000000"),
                        this.oldRecordVersionOwnerRewardCommunity,
                        await web3.utils.toWei("10000000"),
                        "Test",
                        "image.png",
                    ],
                ])
            ).to.eventually.be.rejectedWith("INVALID: USER_BALANCE_MORE_THAN_SUPPLY");
        });

        it("Test the voting with record reward limit, check what happens when user gives reward amount less then 1 ether", async function() {
            let newGovernanceTokenId = "4";
            let newCommunityTokenId = "5";

            let oldVersionOwnerRewardGovernance = await web3.utils.toWei("0.51");
            let oldVersionOwnerRewardCommunity = await web3.utils.toWei("0.21");

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
                    oldVersionOwnerRewardGovernance,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
                [
                    await web3.utils.toWei("1000000"),
                    oldVersionOwnerRewardCommunity,
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
            ).to.eventually.be.bignumber.equal(new BN(oldVersionOwnerRewardGovernance));

            //The owner of the new version request gets his tokens.
            await expect(
                this.treasuryCoreContract.balanceOf(this.user1, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("450000")));
            await expect(
                this.treasuryCoreContract.balanceOf(this.user1, newCommunityTokenId)
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

            // exact transfer amount 0.3416999998995 ether
            // expect 0.341699999999899500 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user2, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0.341699999999899500")));

            // exact we should receive is 0.1407 ether
            // but due to precision we receive 0.140699999999799000 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user2, newCommunityTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0.140699999999799000")));

            // exact transfer amount 0.005666666665 ether
            // expect 0.005666666666665000 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user3, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0.005666666666665000")));
            // exact transfer amount 0.002333333335 ether
            // expect 0.002333333333330000 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user3, newCommunityTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0.002333333333330000")));

            // exact transfer amount 0.005666666665 ether
            // expect 0.005666666666665000 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user4, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0.005666666666665000")));
            // exact transfer amount 0.002333333335 ether
            // expect 0.002333333333330000 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user4, newCommunityTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0.002333333333330000")));
        });

        it("Allowing 0 to be possible option as a reward for existing records owner on new record version creation", async function() {
            let newGovernanceTokenId = "4";
            let newCommunityTokenId = "5";

            let oldVersionOwnerRewardGovernance = await web3.utils.toWei("0");
            let oldVersionOwnerRewardCommunity = await web3.utils.toWei("0");

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
                    oldVersionOwnerRewardGovernance,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
                [
                    await web3.utils.toWei("1000000"),
                    oldVersionOwnerRewardCommunity,
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
            ).to.eventually.be.bignumber.equal(new BN(oldVersionOwnerRewardGovernance));

            //The owner of the new version request gets his tokens.
            await expect(
                this.treasuryCoreContract.balanceOf(this.user1, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("450000")));
            await expect(
                this.treasuryCoreContract.balanceOf(this.user1, newCommunityTokenId)
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

            // exact transfer amount 0 ether
            // expect 0 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user2, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0")));

            // exact we should receive is 0 ether
            // but due to precision we receive 0 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user2, newCommunityTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0")));

            // exact transfer amount 0 ether
            // expect 0 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user3, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0")));
            // exact transfer amount 0 ether
            // expect 0 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user3, newCommunityTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0")));

            // exact transfer amount 0 ether
            // expect 0 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user4, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0")));
            // exact transfer amount 0 ether
            // expect 0 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user4, newCommunityTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0")));
        });

        it("Allowing user to own all the tokens in record creation and new version creation", async function() {
            let newGovernanceTokenId = "4";
            let newCommunityTokenId = "5";

            let oldVersionOwnerRewardGovernance = await web3.utils.toWei("0");
            let oldVersionOwnerRewardCommunity = await web3.utils.toWei("0");

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
                    oldVersionOwnerRewardGovernance,
                    await web3.utils.toWei("1000000"),
                    "Test",
                    "image.png",
                ],
                [
                    await web3.utils.toWei("1000000"),
                    oldVersionOwnerRewardCommunity,
                    await web3.utils.toWei("1000000"),
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
            ).to.eventually.be.bignumber.equal(new BN(oldVersionOwnerRewardGovernance));

            //The owner of the new version request should get all the tokens.
            await expect(
                this.treasuryCoreContract.balanceOf(this.user1, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("1000000")));
            await expect(
                this.treasuryCoreContract.balanceOf(this.user1, newCommunityTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("1000000")));

            // Treasury should be empty
            await expect(
                this.treasuryCoreContract.balanceOf(
                    this.treasuryCoreContract.address,
                    newGovernanceTokenId
                )
            ).to.eventually.be.bignumber.equal(new BN("0"));
            await expect(
                this.treasuryCoreContract.balanceOf(
                    this.treasuryCoreContract.address,
                    newCommunityTokenId
                )
            ).to.eventually.be.bignumber.equal(new BN("0"));

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

            // exact transfer amount 0 ether
            // expect 0 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user2, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0")));

            // exact we should receive is 0 ether
            // but due to precision we receive 0 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user2, newCommunityTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0")));

            // exact transfer amount 0 ether
            // expect 0 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user3, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0")));
            // exact transfer amount 0 ether
            // expect 0 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user3, newCommunityTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0")));

            // exact transfer amount 0 ether
            // expect 0 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user4, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0")));
            // exact transfer amount 0 ether
            // expect 0 ether
            await expect(
                this.treasuryCoreContract.balanceOf(this.user4, newCommunityTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0")));
        });
    });

    context("New Record Version, dilution cases", function() {
        let snapShot2, snapshotId2;
        beforeEach(async function() {
            snapShot2 = await helper.takeSnapshot();
            snapshotId2 = snapShot2["result"];

            const {
                treasuryCoreContractMock,
                treasuryContractMock,
                recordsVotingContractMock,
                recordsContractMock,
                contributionContractMock,
                tracksContractMock,
            } = await getMockContractsForRecordTesting();

            this.treasuryCoreContractMock = treasuryCoreContractMock;
            this.treasuryContractMock = treasuryContractMock;
            this.recordsVotingContractMock = recordsVotingContractMock;
            this.recordsContractMock = recordsContractMock;
            this.contributionContractMock = contributionContractMock;
            this.tracksContractMock = tracksContractMock;

            user1 = await helper.getEthAccount(0);
            user2 = await helper.getEthAccount(1);
            user3 = await helper.getEthAccount(2);
            user4 = await helper.getEthAccount(3);

            await createTrack(this.tracksContractMock, user1);
            await createTrack(this.tracksContractMock, user1);
            await createTrack(this.tracksContractMock, user1);

            //seed contribution id 1
            await this.contributionContractMock.createSeedContribution(
                [1, 2, 3],
                "contribution title",
                "preview.raw",
                "preview.hash",
                "This is the description for the record 1"
            );
            const tx = await this.recordsContractMock.createNewRecord(
                "Test",
                "image.png",
                "Cat1",
                SEED_CONTRIBUTION_ID
            );
            await this.treasuryContractMock.createNewCommunityToken([
                RECORD_ID,
                await web3.utils.toWei("1000000"),
                COMMUNITY_TOKEN_BALANCE_USER1,
                "Test",
                "image.png",
            ]);
            await this.treasuryContractMock.createNewGovernanceToken([
                RECORD_ID,
                await web3.utils.toWei("1000000"),
                GOVERNANCE_TOKEN_BALANCE_USER1,
                "Test",
                "image.png",
            ]);

            await createTrack(this.tracksContractMock, contributionOwner);
            await createTrack(this.tracksContractMock, contributionOwner);

            //this contribution will have id of 2
            await this.contributionContractMock.createNewContribution(
                [4, 5],
                "contribution title",
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

        it("New record version requested, voting done, user won, dilution takes place and tokens are transferred to user before winner declared, causing ballot to lose", async function() {
            let newGovernanceTokenId = "4";
            let newCommunityTokenId = "5";

            let oldVersionOwnerRewardGovernance = await web3.utils.toWei("1000");
            let oldVersionOwnerRewardCommunity = await web3.utils.toWei("1500");

            await this.treasuryCoreContractMock.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("301500"),
                "0xa165"
            );

            const tx2 = await this.recordsVotingContractMock.createNewRecordVersion([
                "Test",
                "image.png",
                "Cat1",
                RECORD_ID,
                [1],
                [
                    await web3.utils.toWei("1000000"),
                    oldVersionOwnerRewardGovernance,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
                [
                    await web3.utils.toWei("1000000"),
                    oldVersionOwnerRewardCommunity,
                    COMMUNITY_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
            ]);

            let trx3 = await this.recordsVotingContractMock.castVote(1, true, { from: user2 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: true,
            });

            // Making token transfer after the ballot is declared
            await this.treasuryCoreContractMock.safeTransferFrom(
                user1,
                user3,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0xa165"
            );

            // Mimicking an token mint / dilution event, and the tokens are also transferred to another user to vote.
            await this.treasuryCoreContractMock.mintTokensForMe(
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("1000000"),
                {
                    from: user3,
                }
            );

            trx3 = await this.recordsVotingContractMock.castVote(1, false, { from: user3 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: false,
            });

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            let trx4 = await this.recordsVotingContractMock.declareWinner(1, { from: user2 });

            expectEvent(trx4, "NewVersionRequestResult", {
                versionReqId: "1",
                tokenId: "2",
                ballotId: "1",
                result: false,
            });
        });

        it("New record version requested, voting done, user won, dilution takes place and tokens are transferred to user before winner declared, user who owned token during winner declaration gets reward", async function() {
            let newGovernanceTokenId = "4";
            let newCommunityTokenId = "5";

            let oldVersionOwnerRewardGovernance = await web3.utils.toWei("1000");
            let oldVersionOwnerRewardCommunity = await web3.utils.toWei("1500");

            await this.treasuryCoreContractMock.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("301500"),
                "0xa165"
            );

            const tx2 = await this.recordsVotingContractMock.createNewRecordVersion([
                "Test",
                "image.png",
                "Cat1",
                RECORD_ID,
                [1],
                [
                    await web3.utils.toWei("1000000"),
                    oldVersionOwnerRewardGovernance,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
                [
                    await web3.utils.toWei("1000000"),
                    oldVersionOwnerRewardCommunity,
                    COMMUNITY_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
            ]);

            let trx3 = await this.recordsVotingContractMock.castVote(1, true, { from: user2 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: true,
            });

            // Making token transfer after the ballot is declared
            await this.treasuryCoreContractMock.safeTransferFrom(
                user1,
                user3,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0xa165"
            );

            // Mimicking an token mint / dilution event, and the tokens are also transferred to another user so that it is considered in the total circulating supply
            await this.treasuryCoreContractMock.mintTokensForMe(
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("1000"),
                {
                    from: user3,
                }
            );

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            let trx4 = await this.recordsVotingContractMock.declareWinner(1, { from: user2 });

            // Make claims for the new tokens.
            await this.recordsVotingContractMock.claimNewRecordTokens(1, { from: user2 });

            // Below user makes claim for reward, he is eligible for reward as the tokens were acquired before the declaration of the winner
            await this.recordsVotingContractMock.claimNewRecordTokens(1, { from: user3 });

            // expected 13.303769401330377
            // received 13.303769401330374000
            await expect(
                this.treasuryCoreContractMock.balanceOf(user3, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("13.303769401330374000")));
            // expected 19.955654101995565
            // received 19.955654101995564000
            await expect(
                this.treasuryCoreContractMock.balanceOf(user3, newCommunityTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("19.955654101995564000")));
        });

        it("New record version requested, voting done, user won, dilution takes place and tokens are transferred to user after winner declared, user who owned token during winner declaration gets reward", async function() {
            let newGovernanceTokenId = "4";
            let newCommunityTokenId = "5";

            let oldVersionOwnerRewardGovernance = await web3.utils.toWei("1000");
            let oldVersionOwnerRewardCommunity = await web3.utils.toWei("1500");

            await this.treasuryCoreContractMock.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("301500"),
                "0xa165"
            );

            const tx2 = await this.recordsVotingContractMock.createNewRecordVersion([
                "Test",
                "image.png",
                "Cat1",
                RECORD_ID,
                [1],
                [
                    await web3.utils.toWei("1000000"),
                    oldVersionOwnerRewardGovernance,
                    GOVERNANCE_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
                [
                    await web3.utils.toWei("1000000"),
                    oldVersionOwnerRewardCommunity,
                    COMMUNITY_TOKEN_BALANCE_USER1,
                    "Test",
                    "image.png",
                ],
            ]);

            let trx3 = await this.recordsVotingContractMock.castVote(1, true, { from: user2 });

            expectEvent(trx3, "NewVersionVoting", {
                versionRequestId: "1",
                ballotId: "1",
                vote: true,
            });

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            let trx4 = await this.recordsVotingContractMock.declareWinner(1, { from: user2 });

            // Making token transfer after the ballot is declared
            await this.treasuryCoreContractMock.safeTransferFrom(
                user1,
                user3,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0xa165"
            );

            // Mimicking an token mint / dilution event, and the tokens are also transferred to another user so that it is considered in the total circulating supply
            await this.treasuryCoreContractMock.mintTokensForMe(
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("1000"),
                {
                    from: user3,
                }
            );

            // Make claims for the new tokens.
            await this.recordsVotingContractMock.claimNewRecordTokens(1, { from: user2 });

            // Below user makes claim but gets 0 tokens in reward
            await this.recordsVotingContractMock.claimNewRecordTokens(1, { from: user3 });

            // Checking user3's balance for new tokens, it is expected to be zero as user acquired tokens after the winner was declared
            await expect(
                this.treasuryCoreContractMock.balanceOf(user3, newGovernanceTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0")));
            await expect(
                this.treasuryCoreContractMock.balanceOf(user3, newCommunityTokenId)
            ).to.eventually.be.bignumber.equal(new BN(web3.utils.toWei("0")));
        });
    });
});

