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
chai.use(chaiBN);
chai.use(chaiAsPromised);

contract("BaseVotingCounterOfferContract", function() {
    before(setup);
    before(createContribution);
    before(async function() {
        await this.votingHubContract.addVotingContract(
            this.baseVotingCounterOfferContractMock.address
        );
        await this.treasuryContract.addSnapshotCaller(
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
        await this.baseVotingCounterOfferContractMock.createBallot(false, COMMUNITY_TOKEN_ID, {
            value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
        });

        await expect(
            this.baseVotingCounterOfferContractMock.castVote(ballotId, true)
        ).to.eventually.be.rejectedWith("UNAUTHORIZED: OWNER_CANNOT_VOTE");
    });

    it("Creating a voting ballot owner can vote", async function() {
        const ballotId = 1;
        await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
        });

        await this.baseVotingCounterOfferContractMock.castVote(ballotId, true);
    });

    it("Creating a voting ballot, and checking for deposit deduction", async function() {
        const ballotId = 1;
        const user2 = await helper.getEthAccount(1);

        let trx = await this.baseVotingCounterOfferContractMock.createBallot(
            true,
            COMMUNITY_TOKEN_ID,
            {
                from: user2,
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
            }
        );
        await expectEvent(trx, "DepositCreated", {
            ballotId: new BN(ballotId),
            depositAmount: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
        });
    });

    it("Creating a voting ballot, single voter and declaring winner, ballot win, checking if deposit refunded", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        let trx = await this.baseVotingCounterOfferContractMock.createBallot(
            true,
            COMMUNITY_TOKEN_ID,
            {
                from: user2,
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
            }
        );
        await expectEvent(trx, "DepositCreated", {
            ballotId: new BN(ballotId),
            depositAmount: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
        });

        await this.baseVotingCounterOfferContractMock.castVote(ballotId, true, { from: user1 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx2 = await this.baseVotingCounterOfferContractMock.declareWinner(ballotId);

        await expectEvent(trx2, "BallotResult", { ballotId: new BN(ballotId), result: true });

        await expectEvent(trx2, "DepositClaimed", { ballotId: new BN(ballotId) });
    });

    it("Creating a voting ballot, single voter and declaring winner, ballot win", async function() {
        const ballotId = 1;
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);

        await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
            value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
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

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0xa165"
        );

        await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
            value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
        });

        await this.baseVotingCounterOfferContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingCounterOfferContractMock.declareWinner(ballotId);
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

        await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
            value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
        });

        await this.baseVotingCounterOfferContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingCounterOfferContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: true });
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

        await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
            value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
        });

        await this.baseVotingCounterOfferContractMock.castVote(ballotId, false, { from: user1 });
        await this.baseVotingCounterOfferContractMock.castVote(ballotId, false, { from: user2 });
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

        await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
            value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
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

        await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
            value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
        });

        await this.baseVotingCounterOfferContractMock.castVote(ballotId, true, { from: user2 });
        await this.baseVotingCounterOfferContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingCounterOfferContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", { ballotId: new BN(ballotId), result: false });
    });

    it("Creating a voting ballot, less then minTurnOut vote", async function() {
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

        await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
            from: user2,
            value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
        });

        await this.baseVotingCounterOfferContractMock.castVote(ballotId, true, { from: user3 });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await this.baseVotingCounterOfferContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", {
            ballotId: new BN(ballotId),
            result: false,
            minTurnOut: false,
        });
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

            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0xa165"
            );

            await this.treasuryCoreContract.safeTransferFrom(
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

        it("Creating a counter offer check if created", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
            });
            let trx = await this.baseVotingCounterOfferContractMock.createCounterOffer(
                this.ballotId,
                {
                    from: this.user1,
                }
            );
            await expectEvent(trx, "CounterOfferCreated", {
                ballotId: new BN(this.ballotId),
            });
        });

        it("Creating a counter offer check if created, accepted check event", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
            });

            await this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                from: this.user1,
            });
            let trx = await this.baseVotingCounterOfferContractMock.counterOfferAction(
                this.ballotId,
                this.user1,
                true,
                {
                    from: this.user2,
                }
            );
            await expectEvent(trx, "CounterOfferResult", {
                ballotId: new BN(this.ballotId),
                result: true,
            });
        });

        it("Creating a counter offer check if created, rejected check event", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
            });

            await this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                from: this.user1,
            });
            let trx = await this.baseVotingCounterOfferContractMock.counterOfferAction(
                this.ballotId,
                this.user1,
                false,
                {
                    from: this.user2,
                }
            );
            await expectEvent(trx, "CounterOfferResult", {
                ballotId: new BN(this.ballotId),
                result: false,
            });
        });

        it("Creating a counter offer check if created, rejected check event try to accept it", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
            });

            await this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                from: this.user1,
            });
            let trx = await this.baseVotingCounterOfferContractMock.counterOfferAction(
                this.ballotId,
                this.user1,
                false,
                {
                    from: this.user2,
                }
            );
            await expectEvent(trx, "CounterOfferResult", {
                ballotId: new BN(this.ballotId),
                result: false,
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
            ).to.eventually.be.rejectedWith("INVALID: ALREADY_VOTED");
        });

        it("Creating a counter offer check if created, rejected check event try to reject it", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
            });

            await this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                from: this.user1,
            });
            let trx = await this.baseVotingCounterOfferContractMock.counterOfferAction(
                this.ballotId,
                this.user1,
                false,
                {
                    from: this.user2,
                }
            );
            await expectEvent(trx, "CounterOfferResult", {
                ballotId: new BN(this.ballotId),
                result: false,
            });
            await expect(
                this.baseVotingCounterOfferContractMock.counterOfferAction(
                    this.ballotId,
                    this.user1,
                    false,
                    {
                        from: this.user2,
                    }
                )
            ).to.eventually.be.rejectedWith("INVALID: ALREADY_VOTED");
        });

        it("Creating a counter offer check if created, accepted check event try to accept it", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
            });

            await this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                from: this.user1,
            });
            let trx = await this.baseVotingCounterOfferContractMock.counterOfferAction(
                this.ballotId,
                this.user1,
                true,
                {
                    from: this.user2,
                }
            );
            await expectEvent(trx, "CounterOfferResult", {
                ballotId: new BN(this.ballotId),
                result: true,
            });
            await expect(
                this.baseVotingCounterOfferContractMock.counterOfferAction(
                    this.ballotId,
                    this.user1,
                    false,
                    {
                        from: this.user2,
                    }
                )
            ).to.eventually.be.rejectedWith("INVALID: ALREADY_VOTED");
        });

        it("Creating a counter offer check if created, accepted check event try to accept it", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
            });

            await this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                from: this.user1,
            });
            let trx = await this.baseVotingCounterOfferContractMock.counterOfferAction(
                this.ballotId,
                this.user1,
                true,
                {
                    from: this.user2,
                }
            );
            await expectEvent(trx, "CounterOfferResult", {
                ballotId: new BN(this.ballotId),
                result: true,
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
            ).to.eventually.be.rejectedWith("INVALID: ALREADY_VOTED");
        });

        it("Creating a counter offer, only owner of ballot can accept counter offer", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
            });

            await this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                from: this.user1,
            });

            await expect(
                this.baseVotingCounterOfferContractMock.counterOfferAction(
                    this.ballotId,
                    this.user1,
                    true,
                    {
                        from: this.user3,
                    }
                )
            ).to.eventually.be.rejectedWith("INVALID: ONLY_BALLOT_OWNER");

            let trx = await this.baseVotingCounterOfferContractMock.counterOfferAction(
                this.ballotId,
                this.user1,
                true,
                {
                    from: this.user2,
                }
            );
            await expectEvent(trx, "CounterOfferResult", {
                ballotId: new BN(this.ballotId),
                result: true,
            });
        });

        it("Creating a counter offer, only owner of ballot can reject counter offer", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
            });

            await this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                from: this.user1,
            });

            await expect(
                this.baseVotingCounterOfferContractMock.counterOfferAction(
                    this.ballotId,
                    this.user1,
                    false,
                    {
                        from: this.user3,
                    }
                )
            ).to.eventually.be.rejectedWith("INVALID: ONLY_BALLOT_OWNER");
            let trx = await this.baseVotingCounterOfferContractMock.counterOfferAction(
                this.ballotId,
                this.user1,
                false,
                {
                    from: this.user2,
                }
            );
            await expectEvent(trx, "CounterOfferResult", {
                ballotId: new BN(this.ballotId),
                result: false,
            });
        });

        it("Creating a counter offer, owner of counter offer cannot accept counter offer", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
            });

            await this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                from: this.user1,
            });

            await expect(
                this.baseVotingCounterOfferContractMock.counterOfferAction(
                    this.ballotId,
                    this.user1,
                    true,
                    {
                        from: this.user1,
                    }
                )
            ).to.eventually.be.rejectedWith("INVALID: ONLY_BALLOT_OWNER");
        });

        it("Creating a counter offer, owner of counter offer cannot reject counter offer", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
            });

            await this.baseVotingCounterOfferContractMock.createCounterOffer(this.ballotId, {
                from: this.user1,
            });

            await expect(
                this.baseVotingCounterOfferContractMock.counterOfferAction(
                    this.ballotId,
                    this.user1,
                    false,
                    {
                        from: this.user1,
                    }
                )
            ).to.eventually.be.rejectedWith("INVALID: ONLY_BALLOT_OWNER");
        });

        it("Creating a voting ballot, Tries to vote after counter offer, expect revert", async function() {
            await this.baseVotingCounterOfferContractMock.createBallot(true, COMMUNITY_TOKEN_ID, {
                from: this.user2,
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
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
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
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
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
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
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
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
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
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
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
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
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
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
                value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
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

            await this.treasuryCoreContract.safeTransferFrom(
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

    it("Creating a voting ballot, create counter offer, reject counter offer, dilution, wins", async function() {
        const {
            treasuryCoreContractMock,
            baseVotingCounterOfferContractMock,
        } = await createContributionWithMockTreasury();

        //Removing all the other voting contracts temporarily
        await this.votingHubContract.removeVotingContract(0);
        await this.votingHubContract.removeVotingContract(0);
        await this.votingHubContract.removeVotingContract(0);
        await this.votingHubContract.removeVotingContract(0);

        await this.votingHubContract.addVotingContract(baseVotingCounterOfferContractMock.address);

        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);
        const user4 = await helper.getEthAccount(3);
        const user5 = await helper.getEthAccount(4);

        const ballotId = 1;
        const tokenId = 2;

        // Minting tokens and transferring into different accounts
        await treasuryCoreContractMock.mintTokensForMe(tokenId, await web3.utils.toWei("10000"), {
            from: user1,
        });
        await treasuryCoreContractMock.mintTokensForMe(tokenId, await web3.utils.toWei("49000"), {
            from: user2,
        });
        await treasuryCoreContractMock.mintTokensForMe(tokenId, await web3.utils.toWei("1000"), {
            from: user3,
        });
        await treasuryCoreContractMock.mintTokensForMe(tokenId, await web3.utils.toWei("25000"), {
            from: user4,
        });
        await treasuryCoreContractMock.mintTokensForMe(tokenId, await web3.utils.toWei("25000"), {
            from: user5,
        });

        // Create a voting ballot
        await baseVotingCounterOfferContractMock.createBallot(true, tokenId, {
            from: user2,
            value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
        });

        // Here we are voting from 2 accounts and the minTurnOut is matched
        await baseVotingCounterOfferContractMock.castVote(ballotId, true, { from: user2 });
        // User 3 votes for ballot but still the winRatio is not matched
        await baseVotingCounterOfferContractMock.castVote(ballotId, true, { from: user3 });

        // Creating a counterOffer
        await baseVotingCounterOfferContractMock.createCounterOffer(ballotId, {
            from: user4,
        });

        // rejecting a counterOffer
        await baseVotingCounterOfferContractMock.counterOfferAction(ballotId, user4, false, {
            from: user2,
        });

        // Here we mint new tokens and then transfer it to user3 who has voted yes, So the vote should now win
        await treasuryCoreContractMock.mintTokensForMe(tokenId, await web3.utils.toWei("550000"), {
            from: user3,
        });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await baseVotingCounterOfferContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", {
            ballotId: new BN(ballotId),
            result: true,
        });
    });

    it("Creating a voting ballot, create counter offer, accept counter offer, dilution, lose", async function() {
        const {
            treasuryCoreContractMock,
            baseVotingCounterOfferContractMock,
        } = await createContributionWithMockTreasury();

        //Removing all the other voting contracts temporarily
        await this.votingHubContract.removeVotingContract(0);
        await this.votingHubContract.removeVotingContract(0);
        await this.votingHubContract.removeVotingContract(0);
        await this.votingHubContract.removeVotingContract(0);

        await this.votingHubContract.addVotingContract(baseVotingCounterOfferContractMock.address);

        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);
        const user4 = await helper.getEthAccount(3);
        const user5 = await helper.getEthAccount(4);

        const ballotId = 1;
        const tokenId = 2;

        // Minting tokens and transferring into different accounts
        await treasuryCoreContractMock.mintTokensForMe(tokenId, await web3.utils.toWei("10000"), {
            from: user1,
        });
        await treasuryCoreContractMock.mintTokensForMe(tokenId, await web3.utils.toWei("49000"), {
            from: user2,
        });
        await treasuryCoreContractMock.mintTokensForMe(tokenId, await web3.utils.toWei("1000"), {
            from: user3,
        });
        await treasuryCoreContractMock.mintTokensForMe(tokenId, await web3.utils.toWei("25000"), {
            from: user4,
        });
        await treasuryCoreContractMock.mintTokensForMe(tokenId, await web3.utils.toWei("25000"), {
            from: user5,
        });

        // Create a voting ballot
        await baseVotingCounterOfferContractMock.createBallot(true, tokenId, {
            from: user2,
            value: helper.VOTING_DEPOSIT_MOCK_CONTRACT,
        });

        // Here we are voting from 2 accounts and the minTurnOut is matched
        await baseVotingCounterOfferContractMock.castVote(ballotId, true, { from: user2 });
        // User 3 votes for ballot but still the winRatio is not matched
        await baseVotingCounterOfferContractMock.castVote(ballotId, false, { from: user3 });

        // Creating a counterOffer
        await baseVotingCounterOfferContractMock.createCounterOffer(ballotId, {
            from: user4,
        });

        // accepting a counterOffer
        await baseVotingCounterOfferContractMock.counterOfferAction(ballotId, user4, true, {
            from: user2,
        });

        // Here we mint new tokens and then transfer it to user3 who has voted no, So the vote should now lose
        await treasuryCoreContractMock.mintTokensForMe(tokenId, await web3.utils.toWei("550000"), {
            from: user3,
        });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        let trx = await baseVotingCounterOfferContractMock.declareWinner(ballotId);
        await expectEvent(trx, "BallotResult", {
            ballotId: new BN(ballotId),
            result: false,
        });
    });
});

