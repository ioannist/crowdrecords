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

contract("BaseVotingCounterOfferContract", function() {
    before(setup);
    before(createContribution);
    before(async function() {
        await this.votingHubContract.addVotingContract(
            this.baseVotingCounterOfferContractMock.address
        );
    });

    let snapShot, snapshotId;
    beforeEach(async function() {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot["result"];
    });
    afterEach(async function() {
        await helper.revertToSnapshot(snapshotId);
    });

    it("Creating a voting ballot UNAUTHORIZED: OWNER_CANNOT_VOTE", async function() {
        const ballotId = 1;
        await this.baseVotingCounterOfferContractMock.createBallot(false, COMMUNITY_TOKEN_ID);

        await expect(
            this.baseVotingCounterOfferContractMock.castVote(ballotId, true)
        ).to.eventually.be.rejectedWith("UNAUTHORIZED: OWNER_CANNOT_VOTE");
    });

    it("Creating a voting ballot owner can vote", async function() {
        const ballotId = 1;
        await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID);

        await this.baseVotingCounterOfferContractMock.castVote(ballotId, true);
    });

    it("Creating a voting ballot, single voter and declaring winner, ballot win", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
        });

        await this.baseVotingCounterOfferContractMock.castVote(ballotId, true, { from: user1 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingCounterOfferContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: true });
    });

    it("Creating a voting ballot, single voter and declaring winner, ballot lose", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.treasuryContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
        });

        await this.baseVotingCounterOfferContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingCounterOfferContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: false });
    });

    it("Creating a voting ballot, ballot win with 67%", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.treasuryContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("301500"),
            "0xa165"
        );

        await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
        });

        await this.baseVotingCounterOfferContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingCounterOfferContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: true });
    });

    it("Creating a voting ballot, ballot lose with 65%", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.treasuryContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("292500"),
            "0xa165"
        );

        await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
        });

        await this.baseVotingCounterOfferContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingCounterOfferContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: false });
    });

    it("Creating a voting ballot, multiple voter and declaring winner, ballot win", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.treasuryContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.treasuryContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
        });

        await this.baseVotingCounterOfferContractMock.castVote(ballotId, true);
        await this.baseVotingCounterOfferContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingCounterOfferContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: true });
    });

    it("Creating a voting ballot, multiple voter and declaring winner, ballot lose", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.treasuryContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.treasuryContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
        });

        await this.baseVotingCounterOfferContractMock.castVote(ballotId, true, { from: user2 });
        await this.baseVotingCounterOfferContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingCounterOfferContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: false });
    });

    context("counter offers", function() {
        let snapShot2, snapshotId2;
        beforeEach(async function() {
            snapShot2 = await helper.takeSnapshot();
            snapshotId2 = snapShot2["result"];

            this.ballotId = 1;
            this.user1 = await helper.getEthAccount(0);
            this.user2 = await helper.getEthAccount(1);
            this.user3 = await helper.getEthAccount(2);

            await this.treasuryContract.safeTransferFrom(
                this.user1,
                this.user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0xa165"
            );

            await this.treasuryContract.safeTransferFrom(
                this.user1,
                this.user3,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0xa165"
            );
        });
        afterEach(async function() {
            await helper.revertToSnapshot(snapshotId2);
        });

        it("Creating a voting ballot, Tries to vote after counter offer, expect revert", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
            });

            await this.baseVotingCounterOfferContractMock.castVote(this.ballotId, true, {
                from: this.user2,
            });
            await this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                from: this.user1,
            });
            await expect(
                this.baseVotingCounterOfferContractMock.castVote(this.ballotId, true, {
                    from: this.user1,
                })
            ).to.eventually.rejectedWith("INVALID: ALREADY_COUNTER_OFFERED");
        });

        it("Creating a voting ballot, Tries to create counter offer after vote, expect revert", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
            });

            await this.baseVotingCounterOfferContractMock.castVote(this.ballotId, true, {
                from: this.user2,
            });
            await this.baseVotingCounterOfferContractMock.castVote(this.ballotId, true, {
                from: this.user1,
            });
            await expect(
                this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                    from: this.user1,
                })
            ).to.eventually.rejectedWith("INVALID: ALREADY_VOTED");
        });

        it("Creating a voting ballot, Tries to create 2 counter offers, expect revert", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
            });

            await this.baseVotingCounterOfferContractMock.castVote(this.ballotId, true, {
                from: this.user2,
            });
            await this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                from: this.user1,
            });
            await expect(
                this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                    from: this.user1,
                })
            ).to.eventually.rejectedWith("INVALID: ALREADY_COUNTER_OFFERED");
        });

        it("Creating a voting ballot, create counter offer, win", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
            });

            await this.baseVotingCounterOfferContractMock.castVote(this.ballotId, true, {
                from: this.user2,
            });
            await this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                from: this.user1,
            });
            await this.baseVotingCounterOfferContractMock.counterOfferAction(
                this.ballotId,
                this.user1,
                true,
                {
                    from: this.user2,
                }
            );

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            let trx = await this.baseVotingCounterOfferContractMock.declareWinner(this.ballotId);
            await expectEvent(trx, "BallotResult", {
                ballotId: new BN(this.ballotId),
                result: true,
            });
        });

        it("Creating a voting ballot, create counter offer, lose", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
            });

            await this.baseVotingCounterOfferContractMock.castVote(this.ballotId, true, {
                from: this.user2,
            });
            await this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                from: this.user1,
            });
            await this.baseVotingCounterOfferContractMock.counterOfferAction(
                this.ballotId,
                this.user1,
                false,
                {
                    from: this.user2,
                }
            );

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            let trx = await this.baseVotingCounterOfferContractMock.declareWinner(this.ballotId);
            await expectEvent(trx, "BallotResult", {
                ballotId: new BN(this.ballotId),
                result: false,
            });
        });

        it("Creating a voting ballot, create counter offer, no action taken lose", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
            });

            await this.baseVotingCounterOfferContractMock.castVote(this.ballotId, true, {
                from: this.user2,
            });
            await this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                from: this.user1,
            });

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            let trx = await this.baseVotingCounterOfferContractMock.declareWinner(this.ballotId);
            await expectEvent(trx, "BallotResult", {
                ballotId: new BN(this.ballotId),
                result: false,
            });
        });

        it("Owner of ballot Tries to take action without counter offer, expect revert", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
            });

            await this.baseVotingCounterOfferContractMock.castVote(this.ballotId, true, {
                from: this.user2,
            });

            await expect(
                this.baseVotingCounterOfferContractMock.counterOfferAction(
                    this.ballotId,
                    this.user1,
                    true,
                    {
                        from: this.user2,
                    }
                )
            ).to.eventually.rejectedWith("INVALID: COUNTER_OFFER_NOT_EXISTS");
        });

        it("Creating a voting ballot, create counter offer, transfers token, wins", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
            });

            await this.baseVotingCounterOfferContractMock.castVote(this.ballotId, true, {
                from: this.user2,
            });
            await this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                from: this.user1,
            });
            await this.baseVotingCounterOfferContractMock.counterOfferAction(
                this.ballotId,
                this.user1,
                false,
                {
                    from: this.user2,
                }
            );

            await this.treasuryContract.safeTransferFrom(
                this.user1,
                this.user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("350000"),
                "0xa165"
            );

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            let trx = await this.baseVotingCounterOfferContractMock.declareWinner(this.ballotId);
            await expectEvent(trx, "BallotResult", {
                ballotId: new BN(this.ballotId),
                result: true,
            });
        });
    });
});

