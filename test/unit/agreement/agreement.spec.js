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
const expect = chai.expect;

contract("AgreementContract", function () {
    before(setup);
    before(generateTokens);

    let snapShot, snapshotId;
    beforeEach(async function () {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot["result"];
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
                totalSupplyEther: await web3.utils.fromWei(COMMUNITY_TOKEN_BALANCE_USER1, "ether"),
                dividendAmountWei: this.singleRewardAmount,
                dividendId: new BN(1),
                tokenId: new BN(COMMUNITY_TOKEN_ID),
                snapshotId: new BN(1),
            });
        });

        it("Should emit RoyaltyPaymentClaimed", async function () {
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, this.singleRewardAmount);

            const claimRoyaltyResult = await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                from: this.user2,
            });

            expectEvent(claimRoyaltyResult, "RoyaltyPaymentClaimed");
        });

        it("Should emit RoyaltyPaymentClaimed with correct amount", async function () {
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, this.singleRewardAmount);

            const claimRoyaltyResult = await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                from: this.user2,
            });

            expectEvent(claimRoyaltyResult, "RoyaltyPaymentClaimed", {
                recordId: new BN(RECORD_ID),
                dividendId: new BN(1),
                rewardAmount: new BN("2222222222222220000"),
                userAddress: this.user2,
            });
        });

        it("trying to claim reward twice should revert", async function () {
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, this.singleRewardAmount);

            const claimRoyaltyResult = await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
                from: this.user2,
            });

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

    it("Paying royalty for invalid record, transaction should revert", async function () {
        const CRDToken = await this.treasuryContract.CRD();
        const invalidRecord = 4;
        let singleRewardAmount = new BN(200);

        await this.treasuryContract.setApprovalForAll(this.agreementContract.address, true);
        await expect(
            this.agreementContract.payRoyaltyAmount(invalidRecord, singleRewardAmount)
        ).to.be.rejectedWith("Invalid record id");
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
    // distributing royalty then claiming royalty then distributing then again claiming
    //// claiming royalty without distribution
    // distributing royalty claiming royalty and then again claiming royalty
    //// checking if the event is emited when distributing royalty
    //// checking if the event is emited when distributing royalty and claiming royalty
    //// checking for x event emits when x royalty claims are made
    //// checking for y events when y royalty are distributed
    // distribution of royalty by more than 2 parties and single claimee
    // distribution of royalty by single party and more than 3 claimee
    // distribution of royalty by more than 2 parties and more than 3 claimee
    // distribution of royalty when only 1 is eligible and then distributing again but this time more user are eligible
    //// distribution of royalty and claiming complete amount from treasury and checking nothing is left within it
    // distribution when buy orders are created.

    //Here it will transfer the community tokens from user1 to user2 so that user2 can be eligible for reward
    //Then the user1 pays the royalty amount for the record
    //Then the user2 triggers a claim function to claim the reward
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

    it("Claiming Royalty : No CRD remaining after all user claims token", async function () {
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

        let claimRoyaltyResult = await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
            from: user2,
        });
        expectEvent(claimRoyaltyResult, "RoyaltyPaymentClaimed");

        await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
            from: user1,
        });

        await expect(
            this.treasuryContract.balanceOf(this.agreementContract.address, CRDToken)
        ).eventually.to.be.bignumber.equal("0");
    });
});

