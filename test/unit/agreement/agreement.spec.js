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
chai.use(chaiAsPromised);
const expect = chai.expect;

contract("AgreementContract", function () {
    before(setup);
    before(generateTokens);

    let snapShot0, snapshotId0;
    beforeEach(async function () {
        snapShot0 = await helper.takeSnapshot();
        snapshotId0 = snapShot0["result"];
    });
    afterEach(async function () {
        await helper.revertToSnapshot(snapshotId0);
    });

    it("Creating agreement vote and declaring winner", async function () {
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const CRDToken = await this.treasuryContract.CRD();

        const agreementId = 1;
        await this.agreementContract.createAgreement(RECORD_ID, "Some link", "some hash", {
            from: user2,
        });

        const trx = await this.agreementContract.castVoteForAgreement(agreementId, true);
        await expectEvent(trx, "AgreementVoting", { vote: true });

        await helper.advanceMultipleBlocks(50);

        const winner = await this.agreementContract.declareWinner(agreementId);

        await expectEvent(winner, "BallotResult", {
            agreementId: new BN(agreementId),
            result: true,
        });
    });

    describe("After winning the voting for agreement contract", async function () {
        let snapShot, snapshotId;
        beforeEach(async function () {
            snapShot = await helper.takeSnapshot();
            snapshotId = snapShot["result"];

            this.user1 = await helper.getEthAccount(0);
            this.user2 = await helper.getEthAccount(1);

            this.agreementId = 1;
            await this.agreementContract.createAgreement(RECORD_ID, "Some link", "some hash", {
                from: this.user2,
            });

            const trx = await this.agreementContract.castVoteForAgreement(this.agreementId, true);
            await expectEvent(trx, "AgreementVoting", { vote: true });

            await helper.advanceMultipleBlocks(50);

            const winner = await this.agreementContract.declareWinner(this.agreementId);

            await expectEvent(winner, "BallotResult", {
                agreementId: new BN(this.agreementId),
                result: true,
            });
        });
        afterEach(async function () {
            await helper.revertToSnapshot(snapshotId);
        });
        it("Paying for royalty agreement 9000 tokens", async function () {
            const user1 = await helper.getEthAccount(0);
            const user2 = await helper.getEthAccount(1);
            const CRDToken = await this.treasuryContract.CRD();
            let singleRewardAmount = await web3.utils.toWei("10000");
            let totalReward = await web3.utils.toWei("90000");

            await this.treasuryContract.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0xa165"
            );

            await this.treasuryContract.setApprovalForAll(this.agreementContract.address, true);

            const receipt = await this.agreementContract.payRoyaltyAmount(
                RECORD_ID,
                singleRewardAmount
            );

            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);

            await expect(
                this.treasuryContract.balanceOf(this.agreementContract.address, CRDToken)
            ).eventually.to.be.bignumber.equal(totalReward);
        });

        it("Paying for royalty agreement 200 tokens", async function () {
            const user1 = await helper.getEthAccount(0);
            const user2 = await helper.getEthAccount(1);
            const CRDToken = await this.treasuryContract.CRD();
            let singleRewardAmount = await web3.utils.toWei("200");
            let totalReward = await web3.utils.toWei("200");

            await this.treasuryContract.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0xa165"
            );

            await this.treasuryContract.setApprovalForAll(this.agreementContract.address, true);

            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);

            await expect(
                this.treasuryContract.balanceOf(this.agreementContract.address, CRDToken)
            ).eventually.to.be.bignumber.equal(totalReward);
        });

        describe("Royalty event check", async function () {
            let snapShot2;
            let snapshotId2;
            beforeEach(async function () {
                snapShot2 = await helper.takeSnapshot();
                snapshotId2 = snapShot["result"];

                this.user1 = await helper.getEthAccount(0);
                this.user2 = await helper.getEthAccount(1);
                this.singleRewardAmount = await web3.utils.toWei("200");

                await this.treasuryContract.safeTransferFrom(
                    this.user1,
                    this.user2,
                    COMMUNITY_TOKEN_ID,
                    await web3.utils.toWei("5000"),
                    "0xa165"
                );

                await this.treasuryContract.setApprovalForAll(this.agreementContract.address, true);
            });
            afterEach(async function () {
                await helper.revertToSnapshot(snapshotId2);
            });

            it("Should emit RoyaltyPayment", async function () {
                const payRoyaltyResult = await this.agreementContract.payRoyaltyAmount(
                    RECORD_ID,
                    this.singleRewardAmount
                );

                expectEvent(payRoyaltyResult, "RoyaltyPayment");
            });

            it("Should emit RoyaltyPayment with correct amount", async function () {
                const payRoyaltyResult = await this.agreementContract.payRoyaltyAmount(
                    RECORD_ID,
                    this.singleRewardAmount
                );

                expectEvent(payRoyaltyResult, "RoyaltyPayment", {
                    recordId: new BN(RECORD_ID),
                    totalSupplyEther: await web3.utils.fromWei(
                        COMMUNITY_TOKEN_BALANCE_USER1,
                        "ether"
                    ),
                    dividendAmountWei: this.singleRewardAmount,
                    dividendId: new BN(1),
                    tokenId: new BN(COMMUNITY_TOKEN_ID),
                    snapshotId: new BN(1),
                });
            });

            it("Should emit RoyaltyPaymentClaimed", async function () {
                await this.agreementContract.payRoyaltyAmount(RECORD_ID, this.singleRewardAmount);

                const claimRoyaltyResult = await this.agreementContract.claimRoyaltyAmount(
                    RECORD_ID,
                    {
                        from: this.user2,
                    }
                );

                expectEvent(claimRoyaltyResult, "RoyaltyPaymentClaimed");
            });

            it("Should emit RoyaltyPaymentClaimed with correct amount", async function () {
                await this.agreementContract.payRoyaltyAmount(RECORD_ID, this.singleRewardAmount);

                const claimRoyaltyResult = await this.agreementContract.claimRoyaltyAmount(
                    RECORD_ID,
                    {
                        from: this.user2,
                    }
                );

                expectEvent(claimRoyaltyResult, "RoyaltyPaymentClaimed", {
                    recordId: new BN(RECORD_ID),
                    dividendId: new BN(1),
                    rewardAmount: new BN("2222222222222220000"),
                    userAddress: this.user2,
                });
            });

            it("trying to claim reward twice should revert", async function () {
                await this.agreementContract.payRoyaltyAmount(RECORD_ID, this.singleRewardAmount);

                const claimRoyaltyResult = await this.agreementContract.claimRoyaltyAmount(
                    RECORD_ID,
                    {
                        from: this.user2,
                    }
                );

                expectEvent(claimRoyaltyResult, "RoyaltyPaymentClaimed", {
                    recordId: new BN(RECORD_ID),
                    dividendId: new BN(1),
                    rewardAmount: new BN("2222222222222220000"),
                    userAddress: this.user2,
                });

                await expect(
                    this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                        from: this.user2,
                    })
                ).to.be.rejectedWith("You have no pending claims");
            });
        });

        it("Paying royalty for invalid agreement, transaction should revert", async function () {
            const CRDToken = await this.treasuryContract.CRD();
            const invalidRecord = 40;
            let singleRewardAmount = new BN(200);

            await this.treasuryContract.setApprovalForAll(this.agreementContract.address, true);
            await expect(
                this.agreementContract.payRoyaltyAmount(invalidRecord, singleRewardAmount)
            ).to.be.rejectedWith("Invalid agreement id");
        });

        it("Claiming without reward payment, transaction should revert", async function () {
            const user2 = await helper.getEthAccount(1);
            await expect(
                this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                    from: user2,
                })
            ).to.be.rejectedWith("No royalty payments created yet");
        });

        //TODO : test cases
        //// distributing royalty then claiming royalty then distributing then again claiming
        //// claiming royalty without distribution
        //// distributing royalty claiming royalty and then again claiming royalty
        //// checking if the event is emited when distributing royalty
        //// checking if the event is emited when distributing royalty and claiming royalty
        //// checking for x event emits when x royalty claims are made
        //// checking for y events when y royalty are distributed
        //// distribution of royalty and claiming complete amount from treasury and checking nothing is left within it
        //// When distributor tries to pay really small amount that the dividendPerToken in wei is equals to 0, expect revert
        //if a agreement is being passed by the voting or not
        //Here it will transfer the community tokens from user1 to user2 so that user2 can be eligible for reward
        //Then the user1 pays the royalty amount for the record
        //Then the user2 triggers a claim function to claim the reward
        // distribution of royalty by more than 2 parties and single claimee
        // distribution of royalty by single party and more than 3 claimee
        // distribution of royalty by more than 2 parties and more than 3 claimee
        // distribution of royalty when only 1 is eligible and then distributing again but this time more user are eligible

        it("Claiming Royalty : Single user royalty claim", async function () {
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
            await this.treasuryContract.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                communityTokenOwnedByUser2,
                "0xa165"
            );

            await this.treasuryContract.setApprovalForAll(this.agreementContract.address, true);

            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);

            const claimRoyaltyResult = await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                from: user2,
            });

            await expect(
                this.treasuryContract.balanceOf(user2, CRDToken)
            ).eventually.to.be.bignumber.equal(totalRewardForUser2);

            expectEvent(claimRoyaltyResult, "RoyaltyPaymentClaimed");
        });

        it("Claiming Royalty : No CRD remaining (Very small amount remaining) after all user claims token", async function () {
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
            await this.treasuryContract.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                communityTokenOwnedByUser2,
                "0xa165"
            );

            await this.treasuryContract.setApprovalForAll(this.agreementContract.address, true);

            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);

            let claimRoyaltyResult = await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                from: user2,
            });
            expectEvent(claimRoyaltyResult, "RoyaltyPaymentClaimed");

            await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                from: user1,
            });

            //Checking that now agreement contract should be empty
            //The agreement contract should be empty but due to the division some tokens are left. Currently we are ignoring that as it is very small margin
            await expect(
                this.treasuryContract.balanceOf(this.agreementContract.address, CRDToken)
            ).eventually.to.be.bignumber.equal("400000");
        });

        it("Claiming Royalty : Distributing then claim then distribute then claim for single user", async function () {
            const user1 = await helper.getEthAccount(0);
            const user2 = await helper.getEthAccount(1);
            const CRDToken = await this.treasuryContract.CRD();
            let singleRewardAmount = await web3.utils.toWei("40000");
            let communityTokenOwnedByUser2 = await web3.utils.toWei("5000");

            // royaltyReward = rewardAmount / totalSupply * tokensOwned
            let firstTimeRewardForUser2 = await web3.utils.toWei("444.444444444444440000");
            let secondTimeRewardForUser2 = await web3.utils.toWei("888.888888888888880000");

            //Transfer community token to user2 so he can make claims
            await this.treasuryContract.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                communityTokenOwnedByUser2,
                "0xa165"
            );

            await this.treasuryContract.setApprovalForAll(this.agreementContract.address, true);

            //Distributing first time
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);

            //Claiming for user2 for first time
            await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                from: user2,
            });

            //Checking if the CRD tokens reached to user2 for first time claim
            await expect(
                this.treasuryContract.balanceOf(user2, CRDToken)
            ).eventually.to.be.bignumber.equal(firstTimeRewardForUser2);

            //Distributing for second time
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);

            //Claiming for user2 for second time
            await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                from: user2,
            });

            //Checking if the CRD tokens reached to user2 for first time claim
            await expect(
                this.treasuryContract.balanceOf(user2, CRDToken)
            ).eventually.to.be.bignumber.equal(secondTimeRewardForUser2);
        });

        it("Claiming Royalty : Distributing then claim then distribute then claim for Multiple user", async function () {
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
            await this.treasuryContract.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                communityTokenOwnedByUser2,
                "0xa165"
            );

            await this.treasuryContract.setApprovalForAll(this.agreementContract.address, true);

            //Distributing first time
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);

            //Claiming for user2 for first time
            await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                from: user2,
            });

            //Checking if the CRD tokens reached to user2 for first time claim
            await expect(
                this.treasuryContract.balanceOf(user2, CRDToken)
            ).eventually.to.be.bignumber.equal(firstTimeRewardForUser2);

            //Distributing for second time
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount);

            //Claiming for user2 for second time
            await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                from: user2,
            });

            //Checking if the CRD tokens reached to user2 after Second time claim
            await expect(
                this.treasuryContract.balanceOf(user2, CRDToken)
            ).eventually.to.be.bignumber.equal(secondTimeRewardForUser2);

            //Claiming for user1 for First time : DIVIDEND id 1 and 2
            await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                from: user1,
            });

            //Checking that now agreement contract should be empty
            //The agreement contract should be empty but due to the division some tokens are left. Currently we are ignoring that as it is very small margin
            await expect(
                this.treasuryContract.balanceOf(this.agreementContract.address, CRDToken)
            ).eventually.to.be.bignumber.equal("800000");
        });

        describe("Royalty distribution: with single distribution", function () {
            let snapShot2;
            let snapshotId2;

            beforeEach(async function () {
                snapShot2 = await helper.takeSnapshot();
                snapshotId2 = snapShot2["result"];

                this.user1 = await helper.getEthAccount(0);
                this.user2 = await helper.getEthAccount(1);
                this.user3 = await helper.getEthAccount(2);
                this.CRDToken = await this.treasuryContract.CRD();
                this.singleRewardAmount = await web3.utils.toWei("40000");
                this.communityTokenOwnedByUser2 = await web3.utils.toWei("5000");

                //Transfer community token to user2 so he can make claims
                await this.treasuryContract.safeTransferFrom(
                    this.user1,
                    this.user2,
                    COMMUNITY_TOKEN_ID,
                    this.communityTokenOwnedByUser2,
                    "0xa165"
                );

                await this.treasuryContract.setApprovalForAll(this.agreementContract.address, true);

                //Distributing first time
                await this.agreementContract.payRoyaltyAmount(RECORD_ID, this.singleRewardAmount);
            });
            afterEach(async function () {
                await helper.revertToSnapshot(snapshotId2);
            });

            it("New user purchases tokens and tries to claim reward, CRD balance should remain 0", async function () {
                const communityTokenOwnedByUser3 = await web3.utils.toWei("10000");
                //Transfer community token to user3 so he can make claims
                await this.treasuryContract.safeTransferFrom(
                    this.user1,
                    this.user3,
                    COMMUNITY_TOKEN_ID,
                    communityTokenOwnedByUser3,
                    "0xa165"
                );

                // User3 owns tokens but that is after the reward distribution.
                await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                    from: this.user3,
                });

                //Checking the user balance, it should still be 0
                await expect(
                    this.treasuryContract.balanceOf(this.user3, this.CRDToken)
                ).eventually.to.be.bignumber.equal("0");
            });

            it("User not eligible for reward tries to claim twice, CRD balance should remain 0 and then second time expect revert ", async function () {
                //User tries to make claim on to a record in which user doesn't have any reward, transaction successfully completes with 0 CRD being transferred
                await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                    from: this.user3,
                });

                // User 3 tries to claim the reward which he is not eligible for second time and expects revert
                await expect(
                    this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                        from: this.user3,
                    })
                ).to.eventually.be.rejectedWith("You have no pending claims");
            });

            it("Eligible user tries to claim twice, successful first time and then revert", async function () {
                //Claiming for user for first time
                await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                    from: this.user2,
                });

                const firstTimeRewardForUser2 = await web3.utils.toWei("444.44444444444444");

                //Checking if the CRD tokens reached to user2 for first time claim
                await expect(
                    this.treasuryContract.balanceOf(this.user2, this.CRDToken)
                ).eventually.to.be.bignumber.equal(firstTimeRewardForUser2);

                //Trying to claim second time without new payment being distributed
                await expect(
                    this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                        from: this.user2,
                    })
                ).to.eventually.be.rejectedWith("You have no pending claims");
            });

            it("User only eligible for the latest royalty paid", async function () {
                const communityTokenOwnedByUser3 = await web3.utils.toWei("10000");
                const rewardForUser3 = await web3.utils.toWei("888.88888888888888");

                //Transfer community token to user3 so he can make claims
                await this.treasuryContract.safeTransferFrom(
                    this.user1,
                    this.user3,
                    COMMUNITY_TOKEN_ID,
                    communityTokenOwnedByUser3,
                    "0xa165"
                );

                //Distributing first time
                await this.agreementContract.payRoyaltyAmount(RECORD_ID, this.singleRewardAmount);

                // User 3 owns tokens but that is after the reward distribution.
                // He cannot claim the reward as he isn't eligible for it
                await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                    from: this.user3,
                });

                //User only received the amount of balance that was part of the latest distribution
                await expect(
                    this.treasuryContract.balanceOf(this.user3, this.CRDToken)
                ).to.eventually.be.bignumber.equal(rewardForUser3);
            });
        });

        it("Distribution of small amount which results to near 0 wei per token, expect revert", async function () {
            const user1 = await helper.getEthAccount(0);
            const user2 = await helper.getEthAccount(1);
            const CRDToken = await this.treasuryContract.CRD();
            const singleRewardAmount = await web3.utils.toWei("0.00000000000000001");
            const communityTokenOwnedByUser2 = await web3.utils.toWei("5000");

            //Transfer community token to user2 so he can make claims
            await this.treasuryContract.safeTransferFrom(
                user1,
                user2,
                COMMUNITY_TOKEN_ID,
                communityTokenOwnedByUser2,
                "0xa165"
            );

            await this.treasuryContract.setApprovalForAll(this.agreementContract.address, true);

            //Distributing first time
            await expect(
                this.agreementContract.payRoyaltyAmount(RECORD_ID, singleRewardAmount)
            ).to.eventually.rejectedWith(
                "Insufficient amount, please try again with greater amount"
            );
        });
    });
});

