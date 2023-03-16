const setup = require("../../utils/deployContracts");
const { BigNumber } = require("@ethersproject/bignumber");
const {
    generateTokens,
    SEED_CONTRIBUTION_ID,
    NEW_CONTRIBUTION_1_ID,
    RECORD_ID,
    COMMUNITY_TOKEN_ID,
    GOVERNANCE_TOKEN_ID,
    GOVERNANCE_TOKEN_BALANCE_USER1,
    COMMUNITY_TOKEN_BALANCE_USER1,
} = require("../orders/generateTokens");
const { expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
const helper = require("../../utils/helper");
const chai = require("chai");
const BN = require("bn.js");
const chaiBN = require("chai-bn")(BN);
const chaiAsPromised = require("chai-as-promised");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
chai.use(chaiAsPromised);
const expect = chai.expect;

contract("AgreementContract", function() {
    before(setup);
    before(generateTokens);

    let snapShot0, snapshotId0;
    beforeEach(async function() {
        snapShot0 = await helper.takeSnapshot();
        snapshotId0 = snapShot0["result"];
    });
    afterEach(async function() {
        await helper.revertToSnapshot(snapshotId0);
    });

    it("Creating agreement vote and declaring winner", async function() {
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const CRDToken = await this.treasuryContract.CRD();

        const agreementId = 1;
        await this.agreementContract.createAgreement(RECORD_ID, "Title", "Some link", "some hash", {
            from: user2,
            value: helper.VOTING_DEPOSIT_AGREEMENT_CONTRACT,
        });
        const trx = await this.agreementContract.castVoteForAgreement(agreementId, true);
        await expectEvent(trx, "AgreementVoting", { vote: true });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        const winner = await this.agreementContract.declareWinner(agreementId);

        await expectEvent(winner, "BallotResult", {
            agreementId: new BN(agreementId),
            result: true,
        });
    });

    it("Creating agreement vote, losing the vote and declaring winner", async function() {
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const CRDToken = await this.treasuryContract.CRD();

        const agreementId = 1;
        await this.agreementContract.createAgreement(RECORD_ID, "Title", "Some link", "some hash", {
            from: user2,
            value: helper.VOTING_DEPOSIT_AGREEMENT_CONTRACT,
        });

        const trx = await this.agreementContract.castVoteForAgreement(agreementId, false);
        await expectEvent(trx, "AgreementVoting", { vote: false });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        const winner = await this.agreementContract.declareWinner(agreementId);

        await expectEvent(winner, "BallotResult", {
            agreementId: new BN(agreementId),
            result: false,
        });
    });

    it("Trying to pay royalty to a rejected agreement, expect revert", async function() {
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const CRDToken = await this.treasuryContract.CRD();

        const agreementId = 1;
        await this.agreementContract.createAgreement(RECORD_ID, "Title", "Some link", "some hash", {
            from: user2,
            value: helper.VOTING_DEPOSIT_AGREEMENT_CONTRACT,
        });

        const trx = await this.agreementContract.castVoteForAgreement(agreementId, false);
        await expectEvent(trx, "AgreementVoting", { vote: false });

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        const winner = await this.agreementContract.declareWinner(agreementId);

        await expectEvent(winner, "BallotResult", {
            agreementId: new BN(agreementId),
            result: false,
        });

        await expect(
            this.agreementContract.payRoyaltyAmount(agreementId, await web3.utils.toWei("1000"))
        ).to.eventually.be.rejectedWith("INVALID: AGREEMENT_ID");
    });

    describe("After winning the voting for agreement contract", async function() {
        let snapShot, snapshotId;
        beforeEach(async function() {
            snapShot = await helper.takeSnapshot();
            snapshotId = snapShot["result"];

            this.user1 = await helper.getEthAccount(0);
            this.user2 = await helper.getEthAccount(1);

            this.firstAgreementId = 1;
            await this.agreementContract.createAgreement(
                RECORD_ID,
                "Title",
                "Some link",
                "some hash",
                {
                    from: this.user2,
                    value: helper.VOTING_DEPOSIT_AGREEMENT_CONTRACT,
                }
            );

            const trx = await this.agreementContract.castVoteForAgreement(
                this.firstAgreementId,
                true
            );
            await expectEvent(trx, "AgreementVoting", { vote: true });

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            const winner = await this.agreementContract.declareWinner(this.firstAgreementId);

            await expectEvent(winner, "BallotResult", {
                agreementId: new BN(this.firstAgreementId),
                result: true,
            });
        });
        afterEach(async function() {
            await helper.revertToSnapshot(snapshotId);
        });
        it("Paying for royalty agreement 9000 tokens", async function() {
            const user1 = await helper.getEthAccount(0);
            const user2 = await helper.getEthAccount(1);
            const CRDToken = await this.treasuryContract.CRD();
            let singleRewardAmount = await web3.utils.toWei("10000");
            let totalReward = await web3.utils.toWei("90000");

            await this.treasuryCoreContract.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0xa165"
            );

            await this.treasuryCoreContract.setApprovalForAll(this.agreementContract.address, true);

            const receipt = await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );

            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );

            await expect(
                this.treasuryContract.balanceOf(this.agreementContract.address, CRDToken)
            ).eventually.to.be.bignumber.equal(totalReward);
        });

        it("Paying for royalty agreement 200 tokens", async function() {
            const user1 = await helper.getEthAccount(0);
            const user2 = await helper.getEthAccount(1);
            const CRDToken = await this.treasuryContract.CRD();
            let singleRewardAmount = await web3.utils.toWei("200");
            let totalReward = await web3.utils.toWei("200");

            await this.treasuryCoreContract.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0xa165"
            );

            await this.treasuryCoreContract.setApprovalForAll(this.agreementContract.address, true);

            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );

            await expect(
                this.treasuryContract.balanceOf(this.agreementContract.address, CRDToken)
            ).eventually.to.be.bignumber.equal(totalReward);
        });

        describe("Royalty event check", async function() {
            let snapShot2;
            let snapshotId2;
            beforeEach(async function() {
                snapShot2 = await helper.takeSnapshot();
                snapshotId2 = snapShot["result"];

                this.user1 = await helper.getEthAccount(0);
                this.user2 = await helper.getEthAccount(1);
                this.singleRewardAmount = await web3.utils.toWei("200");

                await this.treasuryCoreContract.safeTransferFrom(
                    this.user1,
                    this.user2,
                    COMMUNITY_TOKEN_ID,
                    await web3.utils.toWei("5000"),
                    "0xa165"
                );

                await this.treasuryCoreContract.setApprovalForAll(
                    this.agreementContract.address,
                    true
                );
            });
            afterEach(async function() {
                await helper.revertToSnapshot(snapshotId2);
            });

            it("Should emit RoyaltyPayment", async function() {
                const payRoyaltyResult = await this.agreementContract.payRoyaltyAmount(
                    this.firstAgreementId,
                    this.singleRewardAmount
                );

                expectEvent(payRoyaltyResult, "RoyaltyPayment");
            });

            it("Should emit RoyaltyPayment with correct amount", async function() {
                const payRoyaltyResult = await this.agreementContract.payRoyaltyAmount(
                    this.firstAgreementId,
                    this.singleRewardAmount
                );

                expectEvent(payRoyaltyResult, "RoyaltyPayment", {
                    recordId: new BN(RECORD_ID),
                    totalSupplyEther: await web3.utils.fromWei(
                        COMMUNITY_TOKEN_BALANCE_USER1,
                        "ether"
                    ),
                    royaltyAmountWei: this.singleRewardAmount,
                    royaltyId: new BN(1),
                    tokenId: new BN(COMMUNITY_TOKEN_ID),
                    snapshotId: new BN(1),
                });
            });

            it("Should emit RoyaltyPaymentClaimed", async function() {
                await this.agreementContract.payRoyaltyAmount(
                    this.firstAgreementId,
                    this.singleRewardAmount
                );

                const claimRoyaltyResult = await this.agreementContract.claimRoyaltyAmount(
                    this.firstAgreementId,
                    {
                        from: this.user2,
                    }
                );

                expectEvent(claimRoyaltyResult, "RoyaltyPaymentClaimed");
            });

            it("Should emit RoyaltyPaymentClaimed with correct amount", async function() {
                await this.agreementContract.payRoyaltyAmount(
                    this.firstAgreementId,
                    this.singleRewardAmount
                );

                const claimRoyaltyResult = await this.agreementContract.claimRoyaltyAmount(
                    this.firstAgreementId,
                    {
                        from: this.user2,
                    }
                );

                expectEvent(claimRoyaltyResult, "RoyaltyPaymentClaimed", {
                    recordId: new BN(RECORD_ID),
                    royaltyId: new BN(1),
                    rewardAmount: new BN("2222222222222220000"),
                    userAddress: this.user2,
                });
            });

            it("trying to claim reward twice should revert", async function() {
                await this.agreementContract.payRoyaltyAmount(
                    this.firstAgreementId,
                    this.singleRewardAmount
                );

                const claimRoyaltyResult = await this.agreementContract.claimRoyaltyAmount(
                    this.firstAgreementId,
                    {
                        from: this.user2,
                    }
                );

                expectEvent(claimRoyaltyResult, "RoyaltyPaymentClaimed", {
                    recordId: new BN(RECORD_ID),
                    royaltyId: new BN(1),
                    rewardAmount: new BN("2222222222222220000"),
                    userAddress: this.user2,
                });

                await expect(
                    this.agreementContract.claimRoyaltyAmount(this.firstAgreementId, {
                        from: this.user2,
                    })
                ).to.be.rejectedWith("NO_PENDING_CLAIMS");
            });
        });

        it("Paying royalty for invalid agreement, transaction should revert", async function() {
            const CRDToken = await this.treasuryContract.CRD();
            const invalidRecord = 40;
            let singleRewardAmount = new BN(200);

            await this.treasuryCoreContract.setApprovalForAll(this.agreementContract.address, true);
            await expect(
                this.agreementContract.payRoyaltyAmount(invalidRecord, singleRewardAmount)
            ).to.be.rejectedWith("INVALID: AGREEMENT_ID");
        });

        it("Claiming without reward payment, transaction should revert", async function() {
            const user2 = await helper.getEthAccount(1);
            await expect(
                this.agreementContract.claimRoyaltyAmount(this.firstAgreementId, {
                    from: user2,
                })
            ).to.be.rejectedWith("NO_ROYALTY_PAYMENTS");
        });

        it("Claiming Royalty : Single user royalty claim", async function() {
            const user1 = await helper.getEthAccount(0);
            const user2 = await helper.getEthAccount(1);
            const CRDToken = await this.treasuryContract.CRD();
            let singleRewardAmount = await web3.utils.toWei("10000");
            let totalReward = await web3.utils.toWei("40000");
            let communityTokenOwnedByUser2 = await web3.utils.toWei("5000");
            let communityTokenTotalSupply = new BN(COMMUNITY_TOKEN_BALANCE_USER1.toString());

            // royaltyReward = rewardAmount / totalSupply * tokensOwned
            let totalRewardForUser2 = await web3.utils.toWei("444.444444444444440000");

            //Transfer community token to user2 so he can make claims
            await this.treasuryCoreContract.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                communityTokenOwnedByUser2,
                "0xa165"
            );

            await this.treasuryCoreContract.setApprovalForAll(this.agreementContract.address, true);

            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );

            const claimRoyaltyResult = await this.agreementContract.claimRoyaltyAmount(
                this.firstAgreementId,
                {
                    from: user2,
                }
            );

            await expect(
                this.treasuryContract.balanceOf(user2, CRDToken)
            ).eventually.to.be.bignumber.equal(totalRewardForUser2);

            expectEvent(claimRoyaltyResult, "RoyaltyPaymentClaimed");
        });

        it("Claiming Royalty : No CRD remaining (Very small amount remaining) after all user claims token", async function() {
            const user1 = await helper.getEthAccount(0);
            const user2 = await helper.getEthAccount(1);
            const CRDToken = await this.treasuryContract.CRD();
            let singleRewardAmount = await web3.utils.toWei("10000");
            let totalReward = await web3.utils.toWei("40000");
            let communityTokenOwnedByUser2 = await web3.utils.toWei("8000");
            let communityTokenTotalSupply = new BN(COMMUNITY_TOKEN_BALANCE_USER1.toString());

            // royaltyReward = rewardAmount / totalSupply * tokensOwned
            let totalRewardForUser2 = await web3.utils.toWei("1422.2");

            //Transfer community token to user2 so he can make claims
            await this.treasuryCoreContract.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                communityTokenOwnedByUser2,
                "0xa165"
            );

            await this.treasuryCoreContract.setApprovalForAll(this.agreementContract.address, true);

            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );

            let claimRoyaltyResult = await this.agreementContract.claimRoyaltyAmount(
                this.firstAgreementId,
                {
                    from: user2,
                }
            );
            expectEvent(claimRoyaltyResult, "RoyaltyPaymentClaimed");

            await this.agreementContract.claimRoyaltyAmount(this.firstAgreementId, {
                from: user1,
            });

            //Checking that now agreement contract should be empty
            //The agreement contract should be empty but due to the division some tokens are left. Currently we are ignoring that as it is very small margin
            await expect(
                this.treasuryContract.balanceOf(this.agreementContract.address, CRDToken)
            ).eventually.to.be.bignumber.equal("400000");
        });

        it("Claiming Royalty : Distributing then claim then distribute then claim for single user", async function() {
            const user1 = await helper.getEthAccount(0);
            const user2 = await helper.getEthAccount(1);
            const CRDToken = await this.treasuryContract.CRD();
            let singleRewardAmount = await web3.utils.toWei("40000");
            let communityTokenOwnedByUser2 = await web3.utils.toWei("5000");

            // royaltyReward = rewardAmount / totalSupply * tokensOwned
            let firstTimeRewardForUser2 = await web3.utils.toWei("444.444444444444440000");
            let secondTimeRewardForUser2 = await web3.utils.toWei("888.888888888888880000");

            //Transfer community token to user2 so he can make claims
            await this.treasuryCoreContract.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                communityTokenOwnedByUser2,
                "0xa165"
            );

            await this.treasuryCoreContract.setApprovalForAll(this.agreementContract.address, true);

            //Distributing first time
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );

            //Claiming for user2 for first time
            await this.agreementContract.claimRoyaltyAmount(this.firstAgreementId, {
                from: user2,
            });

            //Checking if the CRD tokens reached to user2 for first time claim
            await expect(
                this.treasuryContract.balanceOf(user2, CRDToken)
            ).eventually.to.be.bignumber.equal(firstTimeRewardForUser2);

            //Distributing for second time
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );

            //Claiming for user2 for second time
            await this.agreementContract.claimRoyaltyAmount(this.firstAgreementId, {
                from: user2,
            });

            //Checking if the CRD tokens reached to user2 for first time claim
            await expect(
                this.treasuryContract.balanceOf(user2, CRDToken)
            ).eventually.to.be.bignumber.equal(secondTimeRewardForUser2);
        });

        it("2 royalty payments, user has token during first one and not during second one, makes claim to get reward only gets the first royalty", async function() {
            const user1 = await helper.getEthAccount(0);
            const user2 = await helper.getEthAccount(1);
            const CRDToken = await this.treasuryContract.CRD();
            let singleRewardAmount = await web3.utils.toWei("40000");
            let communityTokenOwnedByUser2 = await web3.utils.toWei("5000");

            // royaltyReward = rewardAmount / totalSupply * tokensOwned
            let rewardForUser2 = await web3.utils.toWei("444.444444444444440000");

            //Transfer community token to user2 so he can make claims
            await this.treasuryCoreContract.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                communityTokenOwnedByUser2,
                "0xa165"
            );

            await this.treasuryCoreContract.setApprovalForAll(this.agreementContract.address, true);

            //Distributing first time
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );

            //Returning the tokens that were owner by the user2 so that he can only claim the first payment and not the second one
            await this.treasuryCoreContract.safeTransferFrom(
                user2,
                user1,
                COMMUNITY_TOKEN_ID,
                communityTokenOwnedByUser2,
                "0xa165",
                { from: user2 }
            );

            //Distributing for second time
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );

            //Claiming for user2 for first time
            await this.agreementContract.claimRoyaltyAmount(this.firstAgreementId, {
                from: user2,
            });

            //Checking if the CRD tokens reached to user2 for first time claim
            await expect(
                this.treasuryContract.balanceOf(user2, CRDToken)
            ).eventually.to.be.bignumber.equal(rewardForUser2);
        });

        it("Claiming Royalty : Distributing then claim then distribute then claim for Multiple user", async function() {
            const user1 = await helper.getEthAccount(0);
            const user2 = await helper.getEthAccount(1);
            const CRDToken = await this.treasuryContract.CRD();
            let singleRewardAmount = await web3.utils.toWei("40000");
            let communityTokenOwnedByUser2 = await web3.utils.toWei("5000");

            // royaltyReward = rewardAmount / totalSupply * tokensOwned
            let firstTimeRewardForUser2 = await web3.utils.toWei("444.444444444444440000");
            let secondTimeRewardForUser2 = await web3.utils.toWei("888.888888888888880000");
            let totalRewardForUser1 = await web3.utils.toWei("79111.1111111111");

            //Transfer community token to user2 so he can make claims
            await this.treasuryCoreContract.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                communityTokenOwnedByUser2,
                "0xa165"
            );

            await this.treasuryCoreContract.setApprovalForAll(this.agreementContract.address, true);

            //Distributing first time
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );

            //Claiming for user2 for first time
            await this.agreementContract.claimRoyaltyAmount(this.firstAgreementId, {
                from: user2,
            });

            //Checking if the CRD tokens reached to user2 for first time claim
            await expect(
                this.treasuryContract.balanceOf(user2, CRDToken)
            ).eventually.to.be.bignumber.equal(firstTimeRewardForUser2);

            //Distributing for second time
            await this.agreementContract.payRoyaltyAmount(
                this.firstAgreementId,
                singleRewardAmount
            );

            //Claiming for user2 for second time
            await this.agreementContract.claimRoyaltyAmount(this.firstAgreementId, {
                from: user2,
            });

            //Checking if the CRD tokens reached to user2 after Second time claim
            await expect(
                this.treasuryContract.balanceOf(user2, CRDToken)
            ).eventually.to.be.bignumber.equal(secondTimeRewardForUser2);

            //Claiming for user1 for First time : DIVIDEND id 1 and 2
            await this.agreementContract.claimRoyaltyAmount(this.firstAgreementId, {
                from: user1,
            });

            //Checking that now agreement contract should be empty
            //The agreement contract should be empty but due to the division some tokens are left. Currently we are ignoring that as it is very small margin
            await expect(
                this.treasuryContract.balanceOf(this.agreementContract.address, CRDToken)
            ).eventually.to.be.bignumber.equal("800000");
        });

        describe("Royalty distribution: with single distribution", function() {
            let snapShot2;
            let snapshotId2;

            beforeEach(async function() {
                snapShot2 = await helper.takeSnapshot();
                snapshotId2 = snapShot2["result"];

                this.user1 = await helper.getEthAccount(0);
                this.user2 = await helper.getEthAccount(1);
                this.user3 = await helper.getEthAccount(2);
                this.CRDToken = await this.treasuryContract.CRD();
                this.singleRewardAmount = await web3.utils.toWei("40000");
                this.communityTokenOwnedByUser2 = await web3.utils.toWei("5000");

                //Transfer community token to user2 so he can make claims
                await this.treasuryCoreContract.safeTransferFrom(
                    this.user1,
                    this.user2,
                    COMMUNITY_TOKEN_ID,
                    this.communityTokenOwnedByUser2,
                    "0xa165"
                );

                await this.treasuryCoreContract.setApprovalForAll(
                    this.agreementContract.address,
                    true
                );

                //Distributing first time
                await this.agreementContract.payRoyaltyAmount(
                    this.firstAgreementId,
                    this.singleRewardAmount
                );
            });
            afterEach(async function() {
                await helper.revertToSnapshot(snapshotId2);
            });

            it("New user purchases tokens and tries to claim reward, CRD balance should remain 0", async function() {
                const communityTokenOwnedByUser3 = await web3.utils.toWei("10000");
                //Transfer community token to user3 so he can make claims
                await this.treasuryCoreContract.safeTransferFrom(
                    this.user1,
                    this.user3,
                    COMMUNITY_TOKEN_ID,
                    communityTokenOwnedByUser3,
                    "0xa165"
                );

                // User3 owns tokens but that is after the reward distribution.
                await this.agreementContract.claimRoyaltyAmount(this.firstAgreementId, {
                    from: this.user3,
                });

                //Checking the user balance, it should still be 0
                await expect(
                    this.treasuryContract.balanceOf(this.user3, this.CRDToken)
                ).eventually.to.be.bignumber.equal("0");
            });

            it("User not eligible for reward tries to claim twice, CRD balance should remain 0 and then second time expect revert ", async function() {
                //User tries to make claim on to a record in which user doesn't have any reward, transaction successfully completes with 0 CRD being transferred
                await this.agreementContract.claimRoyaltyAmount(this.firstAgreementId, {
                    from: this.user3,
                });

                // User 3 tries to claim the reward which he is not eligible for second time and expects revert
                await expect(
                    this.agreementContract.claimRoyaltyAmount(this.firstAgreementId, {
                        from: this.user3,
                    })
                ).to.eventually.be.rejectedWith("NO_PENDING_CLAIMS");
            });

            it("Eligible user tries to claim twice, successful first time and then revert", async function() {
                //Claiming for user for first time
                await this.agreementContract.claimRoyaltyAmount(this.firstAgreementId, {
                    from: this.user2,
                });

                const firstTimeRewardForUser2 = await web3.utils.toWei("444.44444444444444");

                //Checking if the CRD tokens reached to user2 for first time claim
                await expect(
                    this.treasuryContract.balanceOf(this.user2, this.CRDToken)
                ).eventually.to.be.bignumber.equal(firstTimeRewardForUser2);

                //Trying to claim second time without new payment being distributed
                await expect(
                    this.agreementContract.claimRoyaltyAmount(this.firstAgreementId, {
                        from: this.user2,
                    })
                ).to.eventually.be.rejectedWith("NO_PENDING_CLAIMS");
            });

            it("User only eligible for the latest royalty paid", async function() {
                const communityTokenOwnedByUser3 = await web3.utils.toWei("10000");
                const rewardForUser3 = await web3.utils.toWei("888.88888888888888");

                //Transfer community token to user3 so he can make claims
                await this.treasuryCoreContract.safeTransferFrom(
                    this.user1,
                    this.user3,
                    COMMUNITY_TOKEN_ID,
                    communityTokenOwnedByUser3,
                    "0xa165"
                );

                //Distributing first time
                await this.agreementContract.payRoyaltyAmount(
                    this.firstAgreementId,
                    this.singleRewardAmount
                );

                // User 3 owns tokens but that is after the reward distribution.
                // He cannot claim the reward as he isn't eligible for it
                await this.agreementContract.claimRoyaltyAmount(this.firstAgreementId, {
                    from: this.user3,
                });

                //User only received the amount of balance that was part of the latest distribution
                await expect(
                    this.treasuryContract.balanceOf(this.user3, this.CRDToken)
                ).to.eventually.be.bignumber.equal(rewardForUser3);
            });
        });

        it("Distribution of small amount which results to near 0 wei per token, expect revert", async function() {
            const user1 = await helper.getEthAccount(0);
            const user2 = await helper.getEthAccount(1);
            const CRDToken = await this.treasuryContract.CRD();
            const singleRewardAmount = await web3.utils.toWei("0.00000000000000001");
            const communityTokenOwnedByUser2 = await web3.utils.toWei("5000");

            //Transfer community token to user2 so he can make claims
            await this.treasuryCoreContract.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                communityTokenOwnedByUser2,
                "0xa165"
            );

            await this.treasuryCoreContract.setApprovalForAll(this.agreementContract.address, true);

            //Distributing first time
            await expect(
                this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount)
            ).to.eventually.rejectedWith("INSUFFICIENT_AMOUNT: NEED_GREATER_AMOUNT");
        });
    });

    describe("Royalty distribution: with multiple distributors", function() {
        let snapShot2;
        let snapshotId2;

        beforeEach(async function() {
            snapShot2 = await helper.takeSnapshot();
            snapshotId2 = snapShot2["result"];

            this.user1 = await helper.getEthAccount(0);
            this.user2 = await helper.getEthAccount(1);
            this.user3 = await helper.getEthAccount(2);
            this.user4 = await helper.getEthAccount(4);
            this.user5 = await helper.getEthAccount(5);
            this.CRDToken = await this.treasuryContract.CRD();
            this.singleRewardAmount = await web3.utils.toWei("5000");
            this.communityTokenOwnedByUser2 = await web3.utils.toWei("5000");
            this.communityTokenOwnedByUser3 = await web3.utils.toWei("5000");
            this.communityTokenOwnedByUser4 = await web3.utils.toWei("5000");
            this.communityTokenOwnedByUser5 = await web3.utils.toWei("5000");
            this.baseCRDTokens = await web3.utils.toWei("5000");

            await this.treasuryCoreContract.setApprovalForAll(this.agreementContract.address, true);

            //Transfer community token to user2 so he can make claims
            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user2,
                COMMUNITY_TOKEN_ID,
                this.communityTokenOwnedByUser2,
                "0xa165"
            );

            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user2,
                this.CRDToken,
                this.baseCRDTokens,
                "0xa165"
            );

            //Transfer community token to user3 so he can make claims
            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user3,
                COMMUNITY_TOKEN_ID,
                this.communityTokenOwnedByUser3,
                "0xa165"
            );

            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user3,
                this.CRDToken,
                this.baseCRDTokens,
                "0xa165"
            );

            //Transfer community token to user4 so he can make claims
            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user4,
                COMMUNITY_TOKEN_ID,
                this.communityTokenOwnedByUser4,
                "0xa165"
            );

            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user4,
                this.CRDToken,
                this.baseCRDTokens,
                "0xa165"
            );

            //Transfer community token to user5 so he can make claims
            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user5,
                COMMUNITY_TOKEN_ID,
                this.communityTokenOwnedByUser5,
                "0xa165"
            );

            await expect(
                this.treasuryContract.balanceOf(this.user2, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(this.communityTokenOwnedByUser2);

            await expect(
                this.treasuryContract.balanceOf(this.user3, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(this.communityTokenOwnedByUser3);

            await expect(
                this.treasuryContract.balanceOf(this.user4, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(this.communityTokenOwnedByUser4);

            await expect(
                this.treasuryContract.balanceOf(this.user5, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(this.communityTokenOwnedByUser5);

            await this.treasuryCoreContract.setApprovalForAll(
                this.agreementContract.address,
                true,
                {
                    from: this.user1,
                }
            );
            await this.treasuryCoreContract.setApprovalForAll(
                this.agreementContract.address,
                true,
                {
                    from: this.user2,
                }
            );
            await this.treasuryCoreContract.setApprovalForAll(
                this.agreementContract.address,
                true,
                {
                    from: this.user3,
                }
            );
            await this.treasuryCoreContract.setApprovalForAll(
                this.agreementContract.address,
                true,
                {
                    from: this.user4,
                }
            );
        });
        afterEach(async function() {
            await helper.revertToSnapshot(snapshotId2);
        });

        it("3 distributors, 3 agreements, 1 record, 3 claimee", async function() {
            const agreementOne = 1;
            const agreementTwo = 2;
            const agreementThree = 3;
            const rewardForUser2 = await web3.utils.toWei("55.555555555555555");
            const rewardForUser3 = await web3.utils.toWei("111.11111111111111");
            await this.agreementContract.createAgreement(
                RECORD_ID,
                "Title",
                "Some link",
                "some hash",
                {
                    from: this.user1,
                    value: helper.VOTING_DEPOSIT_AGREEMENT_CONTRACT,
                }
            );
            await this.agreementContract.createAgreement(
                RECORD_ID,
                "Title",
                "Some link",
                "some hash",
                {
                    from: this.user2,
                    value: helper.VOTING_DEPOSIT_AGREEMENT_CONTRACT,
                }
            );
            await this.agreementContract.createAgreement(
                RECORD_ID,
                "Title",
                "Some link",
                "some hash",
                {
                    from: this.user3,
                    value: helper.VOTING_DEPOSIT_AGREEMENT_CONTRACT,
                }
            );

            await this.agreementContract.castVoteForAgreement(agreementOne, true);
            await this.agreementContract.castVoteForAgreement(agreementTwo, true);
            await this.agreementContract.castVoteForAgreement(agreementThree, true);

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            await this.agreementContract.declareWinner(agreementOne);
            await this.agreementContract.declareWinner(agreementTwo);
            await this.agreementContract.declareWinner(agreementThree);

            //Multiple user distributes royalty and single claims
            await this.agreementContract.payRoyaltyAmount(agreementOne, this.singleRewardAmount, {
                from: this.user1,
            });
            await this.agreementContract.payRoyaltyAmount(agreementTwo, this.singleRewardAmount, {
                from: this.user2,
            });
            await this.agreementContract.payRoyaltyAmount(agreementThree, this.singleRewardAmount, {
                from: this.user3,
            });

            // User3 and User1 makes claims on different agreements
            await this.agreementContract.claimRoyaltyAmount(agreementOne, {
                from: this.user1,
            });
            await this.agreementContract.claimRoyaltyAmount(agreementThree, {
                from: this.user2,
            });

            //Checking individual user balance and it should be increased after distribution of reward
            await expect(
                this.treasuryContract.balanceOf(this.user2, this.CRDToken)
            ).eventually.to.be.bignumber.equal(rewardForUser2);

            //User1 distributes one more royalty
            await this.agreementContract.payRoyaltyAmount(agreementOne, this.singleRewardAmount, {
                from: this.user1,
            });
            // User3 claims and he has 3 pending royalty payouts
            await this.agreementContract.claimRoyaltyAmount(agreementOne, {
                from: this.user3,
            });

            await expect(
                this.treasuryContract.balanceOf(this.user3, this.CRDToken)
            ).eventually.to.be.bignumber.equal(rewardForUser3);
        });

        it("3 distributor accounts, 1 agreements, 1 record, 3 claimee", async function() {
            const agreementOne = 1;
            const rewardForUser2 = new BN(await web3.utils.toWei("55.555555555555555"));
            const rewardForUser3 = new BN(await web3.utils.toWei("111.11111111111111"));
            await this.agreementContract.createAgreement(
                RECORD_ID,
                "Title",
                "Some link",
                "some hash",
                {
                    from: this.user1,
                    value: helper.VOTING_DEPOSIT_AGREEMENT_CONTRACT,
                }
            );
            await this.agreementContract.createAgreement(
                RECORD_ID,
                "Title",
                "Some link",
                "some hash",
                {
                    from: this.user2,
                    value: helper.VOTING_DEPOSIT_AGREEMENT_CONTRACT,
                }
            );
            await this.agreementContract.createAgreement(
                RECORD_ID,
                "Title",
                "Some link",
                "some hash",
                {
                    from: this.user3,
                    value: helper.VOTING_DEPOSIT_AGREEMENT_CONTRACT,
                }
            );

            await this.agreementContract.castVoteForAgreement(agreementOne, true);

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            await this.agreementContract.declareWinner(agreementOne);

            //Multiple user distributes royalty and single claims
            await this.agreementContract.payRoyaltyAmount(agreementOne, this.singleRewardAmount, {
                from: this.user1,
            });

            // User3 and User1 makes claims on different agreements
            await this.agreementContract.claimRoyaltyAmount(agreementOne, {
                from: this.user1,
            });
            await this.agreementContract.claimRoyaltyAmount(agreementOne, {
                from: this.user2,
            });

            //Checking individual user balance and it should be increased after distribution of reward
            await expect(
                this.treasuryContract.balanceOf(this.user2, this.CRDToken)
            ).eventually.to.be.bignumber.equal(rewardForUser2.add(new BN(this.baseCRDTokens)));

            //User1 distributes one more royalty
            await this.agreementContract.payRoyaltyAmount(agreementOne, this.singleRewardAmount, {
                from: this.user1,
            });
            // User3 claims and he has 3 pending royalty payouts
            await this.agreementContract.claimRoyaltyAmount(agreementOne, {
                from: this.user3,
            });

            await expect(
                this.treasuryContract.balanceOf(this.user3, this.CRDToken)
            ).eventually.to.be.bignumber.equal(rewardForUser3.add(new BN(this.baseCRDTokens)));
        });

        async function calculateGasCost(trx) {
            // Obtain gas used from the receipt
            const gasUsed = trx.receipt.gasUsed;

            // Obtain gasPrice from the transaction
            const tx = await web3.eth.getTransaction(trx.tx);
            const gasPrice = tx.gasPrice;

            return await web3.utils.fromWei((gasPrice * gasUsed).toString(), "gwei");
        }

        it("Giving out the 1000 royalties and logging the gas cost foe conditions : all claim together, 50% claims together 25% claims together and single claim every time.", async function() {
            const agreementOne = 1;
            const rewardForUser2 = new BN(await web3.utils.toWei("55.555555555555555"));
            const rewardForUser3 = new BN(await web3.utils.toWei("111.11111111111111"));
            const rewardAmount = new BN(await web3.utils.toWei("100"));
            await this.agreementContract.createAgreement(
                RECORD_ID,
                "Title",
                "Some link",
                "some hash",
                {
                    from: this.user1,
                    value: helper.VOTING_DEPOSIT_AGREEMENT_CONTRACT,
                }
            );

            await this.agreementContract.castVoteForAgreement(agreementOne, true);

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            await this.agreementContract.declareWinner(agreementOne);

            let gasCostWithOnePendingPaymentZeroClaimedPayments;
            let gasCostWithOnePendingPaymentOneClaimedPayments;
            let gasCostWithOnePendingPaymentTwoClaimedPayments;

            let gasCostWithThreePendingPaymentZeroClaimedPayments;
            let gasCostWithTwoPendingPaymentAndThreeClaimedPayments;
            let gasCostWithThreePendingPaymentAndFiveClaimedPayments;
            let gasCostWithTwoPendingPaymentAndEightClaimedPayments;

            let gasCostWithFivePendingPaymentZeroClaimedPayments;
            let gasCostWithFivePendingPaymentFiveClaimedPayments;

            let gasCostWithTenPendingPaymentZeroClaimedPayments;

            for (let i = 0; i < 10; i++) {
                //Multiple user distributes royalty and single claims
                await this.agreementContract.payRoyaltyAmount(agreementOne, rewardAmount, {
                    from: this.user1,
                });

                // User2 makes claims for each payment made for agreement instantly
                let trx = await this.agreementContract.claimRoyaltyAmount(agreementOne, {
                    from: this.user2,
                });
                if (i === 0) {
                    gasCostWithOnePendingPaymentZeroClaimedPayments = await calculateGasCost(trx);
                }
                if (i === 1) {
                    gasCostWithOnePendingPaymentOneClaimedPayments = await calculateGasCost(trx);
                }
                if (i === 2) {
                    gasCostWithOnePendingPaymentTwoClaimedPayments = await calculateGasCost(trx);
                }

                if (i === 2 || i === 4 || i === 7 || i === 9) {
                    // User3 makes claims on agreements only 4 times throughout the cycle
                    trx = await this.agreementContract.claimRoyaltyAmount(agreementOne, {
                        from: this.user3,
                    });

                    if (i === 2) {
                        gasCostWithThreePendingPaymentZeroClaimedPayments = await calculateGasCost(
                            trx
                        );
                    }
                    if (i === 4) {
                        gasCostWithTwoPendingPaymentAndThreeClaimedPayments = await calculateGasCost(
                            trx
                        );
                    }
                    if (i === 7) {
                        gasCostWithThreePendingPaymentAndFiveClaimedPayments = await calculateGasCost(
                            trx
                        );
                    }
                    if (i === 9) {
                        gasCostWithTwoPendingPaymentAndEightClaimedPayments = await calculateGasCost(
                            trx
                        );
                    }
                }

                if (i === 4 || i === 9) {
                    // User4 makes claims on agreements only twice throughout the cycle
                    trx = await this.agreementContract.claimRoyaltyAmount(agreementOne, {
                        from: this.user4,
                    });

                    if (i === 4) {
                        gasCostWithFivePendingPaymentZeroClaimedPayments = await calculateGasCost(
                            trx
                        );
                    }
                    if (i === 9) {
                        gasCostWithFivePendingPaymentFiveClaimedPayments = await calculateGasCost(
                            trx
                        );
                    }
                }

                if (i === 9) {
                    // User5 makes claims on agreements only once throughout the cycle
                    trx = await this.agreementContract.claimRoyaltyAmount(agreementOne, {
                        from: this.user5,
                    });

                    gasCostWithTenPendingPaymentZeroClaimedPayments = await calculateGasCost(trx);
                }
            }

            console.log(
                "gasCostWithOnePendingPaymentZeroClaimedPayments = ",
                gasCostWithOnePendingPaymentZeroClaimedPayments
            );
            console.log(
                "gasCostWithOnePendingPaymentOneClaimedPayments = ",
                gasCostWithOnePendingPaymentOneClaimedPayments
            );
            console.log(
                "gasCostWithOnePendingPaymentTwoClaimedPayments = ",
                gasCostWithOnePendingPaymentTwoClaimedPayments
            );
            console.log(
                "gasCostWithThreePendingPaymentZeroClaimedPayments = ",
                gasCostWithThreePendingPaymentZeroClaimedPayments
            );
            console.log(
                "gasCostWithTwoPendingPaymentAndThreeClaimedPayments = ",
                gasCostWithTwoPendingPaymentAndThreeClaimedPayments
            );
            console.log(
                "gasCostWithThreePendingPaymentAndFiveClaimedPayments = ",
                gasCostWithThreePendingPaymentAndFiveClaimedPayments
            );
            console.log(
                "gasCostWithTwoPendingPaymentAndEightClaimedPayments = ",
                gasCostWithTwoPendingPaymentAndEightClaimedPayments
            );
            console.log(
                "gasCostWithFivePendingPaymentZeroClaimedPayments = ",
                gasCostWithFivePendingPaymentZeroClaimedPayments
            );
            console.log(
                "gasCostWithFivePendingPaymentFiveClaimedPayments = ",
                gasCostWithFivePendingPaymentFiveClaimedPayments
            );
            console.log(
                "gasCostWithTenPendingPaymentZeroClaimedPayments = ",
                gasCostWithTenPendingPaymentZeroClaimedPayments
            );
        });
    });
});

