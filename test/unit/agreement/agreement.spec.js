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
const helper = require("../../utils/helper");
let tryCatch = require("../../utils/exception").tryCatch;
let errTypes = require("../../utils/exception").errTypes;
let {
    checkIfEventEmitted,
    advanceMultipleBlocks,
    checkIfEventData,
    VOTING_INTERVAL_BLOCKS,
} = require("../../utils/helper");

contract("Gas Calculation", function () {
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

    it("Paying for royalty agreement", async function () {
        let rewardAmount = 10000;
        let totalRewardsTime = 9;
        await this.treasuryContract.safeTransferFrom(
            await helper.getEthAccount(0),
            await helper.getEthAccount(1),
            COMMUNITY_TOKEN_ID,
            5000,
            "0xa165"
        );

        await this.treasuryContract.setApprovalForAll(this.agreementContract.address, true);

        let i = totalRewardsTime;
        while (i > 0) {
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, rewardAmount);
            i--;
        }

        assert(
            (rewardAmount * totalRewardsTime).toString() ==
                (
                    await this.treasuryContract.balanceOf(
                        this.agreementContract.address,
                        await this.treasuryContract.CRD()
                    )
                ).toString(),
            "Reward amount not matching with agreement contract balance"
        );
    });

    it("Making claims for royalty rewards", async function () {
        let rewardAmount = BigNumber.from("10000000000000000000000");
        let totalRewardsTime = 5;
        await this.treasuryContract.safeTransferFrom(
            await helper.getEthAccount(0),
            await helper.getEthAccount(1),
            COMMUNITY_TOKEN_ID,
            BigNumber.from("5000000000000000000000"),
            "0xa165"
        );

        await this.treasuryContract.setApprovalForAll(this.agreementContract.address, true);

        let totalRewardForUser2 =
            (rewardAmount / COMMUNITY_TOKEN_BALANCE_USER1) *
            BigNumber.from("5000000000000000000000") *
            totalRewardsTime;

        let i = totalRewardsTime;
        while (i > 0) {
            await this.agreementContract.payRoyaltyAmount(RECORD_ID, rewardAmount);
            i--;
        }

        let claimId = await this.agreementContract.claimRoyaltyAmount(RECORD_ID, {
            from: await helper.getEthAccount(1),
        });
        console.log(
            "🚀 ~ file: agreement.spec.js ~ line 94 ~ claimId",
            totalRewardForUser2.toString(),
            (
                await this.treasuryContract.balanceOf(
                    await helper.getEthAccount(1),
                    await this.treasuryContract.CRD()
                )
            ).toString()
        );

        assert(
            totalRewardForUser2.toString() ==
                (
                    await this.treasuryContract.balanceOf(
                        await helper.getEthAccount(1),
                        await this.treasuryContract.CRD()
                    )
                ).toString(),
            "Reward claiming amount has some error"
        );
    });
});

