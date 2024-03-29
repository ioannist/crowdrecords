const setup = require("../../utils/deployContracts");
const helper = require("../../utils/helper");
const chai = require("chai");
const BN = require("bn.js");
const chaiBN = require("chai-bn")(BN);
const chaiAsPromised = require("chai-as-promised");
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const expect = chai.expect;
chai.use(chaiBN);
chai.use(chaiAsPromised);

contract("Contribution Contract", function() {
    async function createTrack(tracksContract, owner) {
        const tx = await tracksContract.createNewTracks([["fileHash", "fileLink", "Category"]], {
            from: owner,
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
    before(async function() {
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

    it("Trying to call createContributionVotingBallot from outside ContributionContract, expect revert", async function() {
        await expect(
            this.contributionVotingContract.createContributionVotingBallot(
                "2", // Dummy contribution Id
                "1", // Dummy record id
                "2", // Dummy gov record
                "3" //Dummy comm record
            )
        ).to.eventually.be.rejectedWith("UNAUTHORIZED: ONLY_CONTRIBUTION_CONTRACT");
    });

    it("Creating a seed contribution, without platform fee", async function() {
        const user1 = await helper.getEthAccount(0);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        const tx = await this.contributionContract.createSeedContribution(
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

        expectEvent(tx, "ContributionCreated", {
            contributionId: "1",
            recordId: "0",
        });
    });

    it("Creating a seed contribution, with platform fee", async function() {
        const user1 = await helper.getEthAccount(0);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        const before = await web3.eth.getBalance(await helper.getEthAccount(8));
        const tx = await this.contributionContract.createSeedContribution(
            [
                [1, 2, 3],
                "contribution title",
                "preview.raw",
                "preview.hash",
                "This is the description for the record",
            ],
            await helper.getEthAccount(8),
            helper.PLATFORM_FEES,
            { value: helper.PLATFORM_FEES }
        );
        await expect(
            web3.eth.getBalance(await helper.getEthAccount(8))
        ).to.eventually.be.bignumber.equal(BigInt(+before + +helper.PLATFORM_FEES).toString());

        expectEvent(tx, "ContributionCreated", {
            contributionId: "1",
            recordId: "0",
        });
    });

    it("Calling controllerCreateSeedContribution, expect revert", async function() {
        const user1 = await helper.getEthAccount(0);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);

        await expect(
            this.contributionContract.controllerCreateSeedContribution(
                [
                    [1, 2, 3],
                    "contribution title",
                    "preview.raw",
                    "preview.hash",
                    "This is the description for the record",
                ],
                user1
            )
        ).to.eventually.be.rejectedWith("UNAUTHORIZED: CANNOT_PERFORM_ACTION");
    });

    it("Creating seed contribution and record", async function() {
        const user1 = await helper.getEthAccount(0);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);

        //seed contribution id 1
        await this.contributionContract.createSeedContribution(
            [
                [1, 2, 3],
                "contribution title",
                "preview.raw",
                "preview.hash",
                "This is the description for the record 1",
            ],
            await helper.getEthAccount(8),
            0
        );
        const tx = await this.recordsContract.createNewRecord(
            ["Test", "image.png", "Cat1", SEED_CONTRIBUTION_ID],
            await helper.getEthAccount(8),
            "0",
            {
                value: 0,
            }
        );
        expectEvent(tx, "RecordCreated", {
            seedId: "1",
        });
    });

    it("Create new contribution with platform fees and deposit, check both are transferred", async function() {
        const user1 = await helper.getEthAccount(0);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);

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
            "0",
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

        const balanceBefore = await web3.eth.getBalance(await helper.getEthAccount(8));

        await createTrack(this.tracksContract, contributionOwner);
        await createTrack(this.tracksContract, contributionOwner);
        await this.contributionContract.createNewContribution(
            [
                [4, 5],
                "contribution title",
                "preview.raw",
                "preview.hash",
                RECORD_ID,
                false,
                "Test description",
                rewardCommunityToken,
                rewardGovernanceToken,
            ],
            await helper.getEthAccount(8),
            helper.PLATFORM_FEES,
            {
                from: contributionOwner,
                value: +helper.VOTING_DEPOSIT_CONTRIBUTION_CONTRACT + +helper.PLATFORM_FEES,
            }
        );

        await expect(
            web3.eth.getBalance(await helper.getEthAccount(8))
        ).eventually.to.be.bignumber.equal(
            BigInt(+balanceBefore + +helper.PLATFORM_FEES).toString()
        );

        await expect(
            web3.eth.getBalance(this.contributionVotingContract.address)
        ).eventually.to.be.bignumber.equal(helper.VOTING_DEPOSIT_CONTRIBUTION_CONTRACT);
    });

    it("Create new contribution without platform fees and deposit, check the deposit", async function() {
        const user1 = await helper.getEthAccount(0);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);

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
            "0",
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

        const balanceBefore = await web3.eth.getBalance(await helper.getEthAccount(8));

        await createTrack(this.tracksContract, contributionOwner);
        await createTrack(this.tracksContract, contributionOwner);
        await this.contributionContract.createNewContribution(
            [
                [4, 5],
                "contribution title",
                "preview.raw",
                "preview.hash",
                RECORD_ID,
                false,
                "Test description",
                rewardCommunityToken,
                rewardGovernanceToken,
            ],
            await helper.getEthAccount(8),
            "0",
            {
                from: contributionOwner,
                value: +helper.VOTING_DEPOSIT_CONTRIBUTION_CONTRACT,
            }
        );

        await expect(
            web3.eth.getBalance(await helper.getEthAccount(8))
        ).eventually.to.be.bignumber.equal(BigInt(+balanceBefore).toString());

        await expect(
            web3.eth.getBalance(this.contributionVotingContract.address)
        ).eventually.to.be.bignumber.equal(helper.VOTING_DEPOSIT_CONTRIBUTION_CONTRACT);
    });

    it("Calling createNewContribution with recordId that doesn't exists, expect revert", async function() {
        await createTrack(this.tracksContract, contributionOwner);
        await createTrack(this.tracksContract, contributionOwner);
        await expect(
            this.contributionContract.createNewContribution(
                [
                    [1, 2],
                    "contribution title",
                    "preview.raw",
                    "preview.hash",
                    RECORD_ID,
                    false,
                    "Test description",
                    rewardCommunityToken,
                    rewardGovernanceToken,
                ],
                await helper.getEthAccount(8),
                "0",
                {
                    from: contributionOwner,
                    value: +helper.VOTING_DEPOSIT_CONTRIBUTION_CONTRACT,
                    gas: 10_000_000,
                }
            )
        ).to.eventually.be.rejectedWith("INVALID: WRONG_RECORD_ID");
    });

    it("Calling controllerCreateNewContribution, expect revert", async function() {
        const user1 = await helper.getEthAccount(0);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);

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
            "0",
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

        await createTrack(this.tracksContract, contributionOwner);
        await createTrack(this.tracksContract, contributionOwner);

        await expect(
            this.contributionContract.controllerCreateNewContribution(
                [
                    [4, 5],
                    "contribution title",
                    "preview.raw",
                    "preview.hash",
                    RECORD_ID,
                    false,
                    "Test description",
                    rewardCommunityToken,
                    rewardGovernanceToken,
                ],
                user1
            )
        ).to.eventually.be.rejectedWith("UNAUTHORIZED: CANNOT_PERFORM_ACTION");
    });

    context("Testing contribution voting", function() {
        let snapShot2, snapshotId2;
        beforeEach(async function() {
            snapShot2 = await helper.takeSnapshot();
            snapshotId2 = snapShot2["result"];

            const user1 = await helper.getEthAccount(0);
            await createTrack(this.tracksContract, user1);
            await createTrack(this.tracksContract, user1);
            await createTrack(this.tracksContract, user1);

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
                "0",
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

            await createTrack(this.tracksContract, contributionOwner);
            await createTrack(this.tracksContract, contributionOwner);
            await this.contributionContract.createNewContribution(
                [
                    [4, 5],
                    "contribution title",
                    "preview.raw",
                    "preview.hash",
                    RECORD_ID,
                    false,
                    "Test description",
                    rewardCommunityToken,
                    rewardGovernanceToken,
                ],
                await helper.getEthAccount(8),
                helper.PLATFORM_FEES,
                {
                    from: contributionOwner,
                    value: +helper.VOTING_DEPOSIT_CONTRIBUTION_CONTRACT + +helper.PLATFORM_FEES,
                }
            );
        });
        afterEach(async function() {
            await helper.revertToSnapshot(snapshotId2);
        });

        it("Tries to vote to INVALID: CONTRIBUTION_ID, expect revert", async function() {
            const invalidContributionId = 3;
            await expect(
                this.contributionVotingContract.castVoteForContribution(invalidContributionId, true)
            ).to.eventually.be.rejectedWith("INVALID: CONTRIBUTION_ID");
        });

        it("User can vote and event is emitted", async function() {
            const trx = await this.contributionVotingContract.castVoteForContribution(
                NEW_CONTRIBUTION_1_ID,
                true
            );

            expectEvent(trx, "ContributionVoting", {
                contributionId: new BN(NEW_CONTRIBUTION_1_ID),
            });
        });

        it("Cannot Vote More than once", async function() {
            await this.contributionVotingContract.castVoteForContribution(
                NEW_CONTRIBUTION_1_ID,
                true
            );
            await expect(
                this.contributionVotingContract.castVoteForContribution(NEW_CONTRIBUTION_1_ID, true)
            ).to.eventually.be.rejectedWith("INVALID: ALREADY_VOTED");
        });

        it("Declaring voting winner, user wins and reward amount is transferred : One Person Vote", async function() {
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

            expectEvent(tx, "ContributionBallotResult", { result: true });

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(rewardCommunityToken);

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(rewardGovernanceToken);
        });

        it("Declaring voting winner, user loses and reward amount is not transferred", async function() {
            await this.contributionVotingContract.castVoteForContribution(
                NEW_CONTRIBUTION_1_ID,
                false
            );

            //Incrementing the blocks so that we can declare winner
            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 1);

            let tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);
            expectEvent(tx, "ContributionBallotResult", { result: false });

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(new BN(0));

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(new BN(0));
        });

        it("Declaring winner, user should win and receive the reward : Multi Person Vote", async function() {
            await this.contributionVotingContract.castVoteForContribution(
                NEW_CONTRIBUTION_1_ID,
                true
            );

            //Incrementing the blocks so that we can declare winner
            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 1);

            let tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);

            expectEvent(tx, "ContributionBallotResult", { result: true });

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(new BN(await web3.utils.toWei("1000")));

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(new BN(await web3.utils.toWei("1000")));

            //Transferring governance to other account so they can vote
            await this.treasuryCoreContract.safeTransferFrom(
                await helper.getEthAccount(0),
                await helper.getEthAccount(2),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("500"),
                "0x0"
            );
            await this.treasuryCoreContract.safeTransferFrom(
                await helper.getEthAccount(0),
                await helper.getEthAccount(3),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("500"),
                "0x0"
            );

            await createTrack(this.tracksContract, contributionOwner);
            await createTrack(this.tracksContract, contributionOwner);
            //Here user[1] has won and owns 1000 * 10**18 tokens of governance
            //user[0] creates a new contribution and other user votes
            let newContributionId = 3;
            await this.contributionContract.createNewContribution(
                [
                    [4, 5],
                    "contribution title",
                    "preview.raw",
                    "preview.hash",
                    RECORD_ID,
                    false,
                    "Test description",
                    rewardCommunityToken,
                    rewardGovernanceToken,
                ],
                await helper.getEthAccount(8),
                helper.PLATFORM_FEES,
                {
                    from: contributionOwner,
                    value: +helper.VOTING_DEPOSIT_CONTRIBUTION_CONTRACT + +helper.PLATFORM_FEES,
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

            expectEvent(tx, "ContributionBallotResult", { result: false });

            //The balance of user shouldn't increase and still be as same as it was earlier
            await expect(
                this.treasuryContract.balanceOf(contributionOwner, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(new BN(await web3.utils.toWei("1000")));

            //The balance of user shouldn't increase and still be as same as it was earlier
            await expect(
                this.treasuryContract.balanceOf(contributionOwner, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(new BN(await web3.utils.toWei("1000")));
        });

        it("Tries to propose counter offer to invalid contribution id, expect revert", async function() {
            const invalidContributionId = 3;
            const newCommunityReward = "1000000000";
            const newGovernanceReward = "1000000000";
            await expect(
                this.contributionVotingContract.proposeCounterOffer(
                    invalidContributionId,
                    newCommunityReward,
                    newGovernanceReward
                )
            ).to.eventually.be.rejectedWith("INVALID: BALLOT_NOT_FOUND");
        });

        it("User proposes counter offer vote and event is emitted", async function() {
            const newCommunityReward = "1000000000";
            const newGovernanceReward = "1000000000";
            const trx = await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward
            );
            expectEvent(trx, "CounterOfferForContribution", {
                contributionId: new BN(NEW_CONTRIBUTION_1_ID),
            });
        });

        it("Owner accepts counter offer with higher rewards", async function() {
            const newCommunityReward = await web3.utils.toWei("1001");
            const newGovernanceReward = await web3.utils.toWei("1001");
            const counterOfferProposer = await helper.getEthAccount(0);
            const trx = await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward
            );
            expectEvent(trx, "CounterOfferForContribution", {
                contributionId: new BN(NEW_CONTRIBUTION_1_ID),
            });

            const tx = await this.contributionVotingContract.actionOnCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                [counterOfferProposer],
                true,
                { from: contributionOwner }
            );

            const newReward = await this.contributionVotingContract.rewardMapping(
                NEW_CONTRIBUTION_1_ID
            );

            // Check that the reward shouldn't have been modified
            expect(newReward.communityReward).to.be.bignumber.equal(rewardCommunityToken);
            expect(newReward.governanceReward).to.be.bignumber.equal(rewardGovernanceToken);

            // Expect the correct event to be emitted
            expectEvent(tx, "CounterOfferActionForContribution", {
                contributionId: NEW_CONTRIBUTION_1_ID.toString(),
                voter: counterOfferProposer.toString(),
                status: "2",
            });
        });

        it("Owner rejects counter offer", async function() {
            const newCommunityReward = await web3.utils.toWei("1001");
            const newGovernanceReward = await web3.utils.toWei("1001");
            const counterOfferProposer = await helper.getEthAccount(0);

            const trx = await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward
            );

            expectEvent(trx, "CounterOfferForContribution", {
                contributionId: new BN(NEW_CONTRIBUTION_1_ID),
            });

            const tx = await this.contributionVotingContract.actionOnCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                [counterOfferProposer],
                false,
                { from: contributionOwner }
            );

            const newReward = await this.contributionVotingContract.rewardMapping(
                NEW_CONTRIBUTION_1_ID
            );

            // Check that the reward should stay the same
            expect(newReward.communityReward).to.be.bignumber.equal(rewardCommunityToken);
            expect(newReward.governanceReward).to.be.bignumber.equal(rewardGovernanceToken);

            // Expect the correct event to be emitted
            expectEvent(tx, "CounterOfferActionForContribution", {
                contributionId: NEW_CONTRIBUTION_1_ID.toString(),
                voter: counterOfferProposer.toString(),
                status: "3",
            });
        });

        it("Non-owner tries to accept counter offer, expect revert", async function() {
            const newCommunityReward = await web3.utils.toWei("1001");
            const newGovernanceReward = await web3.utils.toWei("1001");
            const counterOfferProposer = await helper.getEthAccount(0);
            const nonOwner = await helper.getEthAccount(1);

            const trx = await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward
            );

            expectEvent(trx, "CounterOfferForContribution", {
                contributionId: new BN(NEW_CONTRIBUTION_1_ID),
            });

            await expect(
                this.contributionVotingContract.actionOnCounterOffer(
                    NEW_CONTRIBUTION_1_ID,
                    [counterOfferProposer],
                    true,
                    { from: nonOwner }
                )
            ).to.eventually.be.rejectedWith("INVALID: ONLY_CONTRIBUTION_OWNER");
        });

        it("Owner tries to accept counter offer with higher community reward and lower governance reward, expect rejection", async function() {
            const newCommunityReward = await web3.utils.toWei("1001"); // More than the existing reward
            const newGovernanceReward = await web3.utils.toWei("999"); // Less than the existing reward
            const counterOfferProposer = await helper.getEthAccount(0);

            const trx = await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward
            );

            expectEvent(trx, "CounterOfferForContribution", {
                contributionId: new BN(NEW_CONTRIBUTION_1_ID),
            });

            const tx = await this.contributionVotingContract.actionOnCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                [counterOfferProposer],
                true,
                { from: contributionOwner }
            );

            const newReward = await this.contributionVotingContract.rewardMapping(
                NEW_CONTRIBUTION_1_ID
            );

            // Check that the reward should stay the same
            expect(newReward.communityReward).to.be.bignumber.equal(rewardCommunityToken);
            expect(newReward.governanceReward).to.be.bignumber.equal(rewardGovernanceToken);

            // Expect no event to be emmited
            expect(tx.receipt.logs.length).to.be.equal(0);
        });

        it("Cannot create counter offer more than once", async function() {
            const newCommunityReward = "1000000000";
            const newGovernanceReward = "1000000000";
            await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward
            );
            await expect(
                this.contributionVotingContract.proposeCounterOffer(
                    NEW_CONTRIBUTION_1_ID,
                    newCommunityReward,
                    newGovernanceReward
                )
            ).to.eventually.be.rejectedWith("INVALID: ALREADY_COUNTER_OFFERED");
        });

        it("Cannot create counter offer after voting", async function() {
            // Voting from users account
            await this.contributionVotingContract.castVoteForContribution(
                NEW_CONTRIBUTION_1_ID,
                true
            );

            const newCommunityReward = "1000000000";
            const newGovernanceReward = "1000000000";

            // Trying to create counter offer from user account who has already voted
            await expect(
                this.contributionVotingContract.proposeCounterOffer(
                    NEW_CONTRIBUTION_1_ID,
                    newCommunityReward,
                    newGovernanceReward
                )
            ).to.eventually.be.rejectedWith("INVALID: ALREADY_VOTED");
        });

        it("Cannot vote after create counter offer", async function() {
            const newCommunityReward = "1000000000";
            const newGovernanceReward = "1000000000";

            // Create counter offer
            await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward
            );

            // Trying to vote from user account who has already
            await expect(
                this.contributionVotingContract.castVoteForContribution(NEW_CONTRIBUTION_1_ID, true)
            ).to.eventually.be.rejectedWith("INVALID: ALREADY_COUNTER_OFFERED");
        });

        it("Calling actionOnCounterOffer with empty array, should not crash", async function() {
            const newCommunityReward = "1000000000";
            const newGovernanceReward = "1000000000";

            // Create counter offer
            await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward
            );

            // Calling actionOnCounterOffer with empty array, it shouldn't crash
            const tx = await this.contributionVotingContract.actionOnCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                [],
                true,
                {
                    from: contributionOwner,
                }
            );
        });

        it("Owner accepts counter offer, and declares winner, contribution should pass", async function() {
            const newCommunityReward = "1000000000";
            const newGovernanceReward = "1000000000";
            await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward,
                {
                    from: await helper.getEthAccount(0),
                }
            );

            // Accepting counter offer
            const trx = await this.contributionVotingContract.actionOnCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                [await helper.getEthAccount(0)],
                true,
                {
                    from: contributionOwner,
                }
            );

            expectEvent(trx, "CounterOfferActionForContribution");

            //Incrementing the blocks so that we can declare winner
            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 1);

            let tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);

            expectEvent(tx, "ContributionBallotResult", { result: true });

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(newCommunityReward);

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(newGovernanceReward);
        });

        it("Owner rejects counter offer, and declares winner, contribution should fail", async function() {
            const newCommunityReward = "10000000";
            const newGovernanceReward = "10000000";
            await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward,
                {
                    from: await helper.getEthAccount(0),
                }
            );

            // Rejecting counter offer
            const trx = await this.contributionVotingContract.actionOnCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                [await helper.getEthAccount(0)],
                false,
                {
                    from: contributionOwner,
                }
            );

            expectEvent(trx, "CounterOfferActionForContribution");

            //Incrementing the blocks so that we can declare winner
            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 1);

            let tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);

            expectEvent(tx, "ContributionBallotResult", { result: false });

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals("0");

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals("0");
        });

        it("Owner rejects multiple counter offer", async function() {
            //Transferring governance to other account so they can vote
            await this.treasuryCoreContract.safeTransferFrom(
                await helper.getEthAccount(0),
                await helper.getEthAccount(2),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("500"),
                "0x0"
            );
            await this.treasuryCoreContract.safeTransferFrom(
                await helper.getEthAccount(0),
                await helper.getEthAccount(3),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("500"),
                "0x0"
            );
            await this.treasuryCoreContract.safeTransferFrom(
                await helper.getEthAccount(0),
                await helper.getEthAccount(4),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("500"),
                "0x0"
            );

            const newCommunityReward = "10000000";
            const newGovernanceReward = "10000000";
            await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward,
                {
                    from: await helper.getEthAccount(0),
                }
            );
            await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward,
                {
                    from: await helper.getEthAccount(2),
                }
            );
            await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward,
                {
                    from: await helper.getEthAccount(3),
                }
            );

            // Rejecting counter offer
            const trx = await this.contributionVotingContract.actionOnCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                [
                    await helper.getEthAccount(0),
                    await helper.getEthAccount(2),
                    await helper.getEthAccount(3),
                    await helper.getEthAccount(4),
                ],
                false,
                {
                    from: contributionOwner,
                }
            );

            expectEvent(trx, "CounterOfferActionForContribution");

            //Incrementing the blocks so that we can declare winner
            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 1);

            let tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);

            expectEvent(tx, "ContributionBallotResult", { result: false });

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals("0");

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals("0");
        });

        it("Owner accepts multiple counter offer", async function() {
            //Transferring governance to other account so they can vote
            await this.treasuryCoreContract.safeTransferFrom(
                await helper.getEthAccount(0),
                await helper.getEthAccount(2),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("500"),
                "0x0"
            );
            await this.treasuryCoreContract.safeTransferFrom(
                await helper.getEthAccount(0),
                await helper.getEthAccount(3),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("500"),
                "0x0"
            );
            await this.treasuryCoreContract.safeTransferFrom(
                await helper.getEthAccount(0),
                await helper.getEthAccount(4),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("500"),
                "0x0"
            );

            const newCommunityReward = "1000000000";
            const newGovernanceReward = "1000000000";
            await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward,
                {
                    from: await helper.getEthAccount(0),
                }
            );
            await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward,
                {
                    from: await helper.getEthAccount(2),
                }
            );
            await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward,
                {
                    from: await helper.getEthAccount(3),
                }
            );

            // Rejecting counter offer
            const trx = await this.contributionVotingContract.actionOnCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                [
                    await helper.getEthAccount(0),
                    await helper.getEthAccount(2),
                    await helper.getEthAccount(3),
                    await helper.getEthAccount(4),
                ],
                true,
                {
                    from: contributionOwner,
                }
            );

            expectEvent(trx, "CounterOfferActionForContribution");

            //Incrementing the blocks so that we can declare winner
            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 1);

            let tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);

            expectEvent(tx, "ContributionBallotResult", { result: true });

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(newCommunityReward);

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(newGovernanceReward);
        });

        it("Owner tries to accept single counter offer multiple time in single call", async function() {
            const newCommunityReward = "1000000000";
            const newGovernanceReward = "1000000000";
            await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward,
                {
                    from: await helper.getEthAccount(0),
                }
            );

            // Rejecting counter offer, while repeating the same address in actionOnCounterOffer
            const trx = await this.contributionVotingContract.actionOnCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                [
                    await helper.getEthAccount(0),
                    await helper.getEthAccount(0),
                    await helper.getEthAccount(0),
                    await helper.getEthAccount(0),
                    await helper.getEthAccount(0),
                    await helper.getEthAccount(0),
                ],
                true,
                {
                    from: contributionOwner,
                }
            );

            expectEvent(trx, "CounterOfferActionForContribution");

            const eventCount = trx.receipt.logs.length;
            // Here the count of CounterOfferAction event should be only 1 as there is only one unique address whose counter offer is to be rejected
            expect(eventCount).to.be.equal(1);

            //Incrementing the blocks so that we can declare winner
            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 1);

            let tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);

            expectEvent(tx, "ContributionBallotResult", { result: true });

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(newCommunityReward);

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(newGovernanceReward);
        });

        it("Owner tries accepts multiple counter offer, some counter offers are valid and some are invalid, it will work normally", async function() {
            //Transferring governance to other account so they can vote
            await this.treasuryCoreContract.safeTransferFrom(
                await helper.getEthAccount(0),
                await helper.getEthAccount(2),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("500"),
                "0x0"
            );
            await this.treasuryCoreContract.safeTransferFrom(
                await helper.getEthAccount(0),
                await helper.getEthAccount(3),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("500"),
                "0x0"
            );
            await this.treasuryCoreContract.safeTransferFrom(
                await helper.getEthAccount(0),
                await helper.getEthAccount(4),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("500"),
                "0x0"
            );

            const newCommunityReward = "1000000000";
            const newGovernanceReward = "1000000000";
            await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward,
                {
                    from: await helper.getEthAccount(0),
                }
            );
            await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward,
                {
                    from: await helper.getEthAccount(2),
                }
            );
            await this.contributionVotingContract.proposeCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                newCommunityReward,
                newGovernanceReward,
                {
                    from: await helper.getEthAccount(3),
                }
            );

            // Rejecting counter offer, and one address has not created any valid counter offer, it should work normally and invalid counter offer id would be ignored
            const trx = await this.contributionVotingContract.actionOnCounterOffer(
                NEW_CONTRIBUTION_1_ID,
                [
                    await helper.getEthAccount(0),
                    await helper.getEthAccount(2),
                    await helper.getEthAccount(3),
                    await helper.getEthAccount(4),
                    await helper.getEthAccount(5),
                ],
                true,
                {
                    from: contributionOwner,
                }
            );

            expectEvent(trx, "CounterOfferActionForContribution");

            //Incrementing the blocks so that we can declare winner
            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 1);

            let tx = await this.contributionVotingContract.declareWinner(NEW_CONTRIBUTION_1_ID);

            expectEvent(tx, "ContributionBallotResult", { result: true });

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(newCommunityReward);

            await expect(
                this.treasuryContract.balanceOf(contributionOwner, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(newGovernanceReward);
        });
    });
});

