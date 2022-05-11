const setup = require("../../utils/deployContracts");
const {
    generateTokens,
    SEED_CONTRIBUTION_ID,
    NEW_CONTRIBUTION_1_ID,
    RECORD_ID,
    COMMUNITY_TOKEN_ID,
    GOVERNANCE_TOKEN_ID,
} = require("./generateTokens");
const helper = require("../../utils/helper");
let tryCatch = require("../../utils/exception").tryCatch;
let errTypes = require("../../utils/exception").errTypes;
let {
    checkIfEventEmitted,
    advanceMultipleBlocks,
    checkIfEventData,
    VOTING_INTERVAL_BLOCKS,
} = require("../../utils/helper");

contract("Orders", function () {
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

    it("User can create lock sale request and cancel it", async function () {
        await this.treasuryContract.setApprovalForAll(this.ordersContract.address, true);

        let trx = await this.ordersContract.createSaleOrder(
            true,
            RECORD_ID,
            COMMUNITY_TOKEN_ID,
            100,
            1,
            GOVERNANCE_TOKEN_ID,
            5,
            2
        );
        checkIfEventEmitted(trx?.logs, "SaleOrder", "SaleOrder event not generated");
        checkIfEventData(
            trx?.logs,
            "SaleOrder",
            "SaleOrder event generated but data mismatch error",
            {
                seller: await helper.getEthAccount(0),
                isLockedInRatio: true,
            }
        );
        let saleId = trx?.logs[0].args.saleId;
        trx = await this.ordersContract.cancelSaleOrder(saleId);
        checkIfEventEmitted(trx?.logs, "SaleClose", "SaleClose event not generated");
        checkIfEventData(
            trx?.logs,
            "SaleClose",
            "SaleClose event generated but data mismatch error",
            {
                saleId: saleId,
            }
        );
    });

    it("User can create normal sale request and cancel it", async function () {
        await this.treasuryContract.setApprovalForAll(this.ordersContract.address, true);

        let trx = await this.ordersContract.createSaleOrder(
            false,
            RECORD_ID,
            COMMUNITY_TOKEN_ID,
            100,
            1,
            GOVERNANCE_TOKEN_ID,
            5,
            2
        );
        checkIfEventEmitted(trx?.logs, "SaleOrder", "SaleOrder event not generated");
        checkIfEventData(
            trx?.logs,
            "SaleOrder",
            "SaleOrder event generated but data mismatch error",
            {
                seller: await helper.getEthAccount(0),
                isLockedInRatio: false,
            }
        );

        let saleId = trx?.logs[0].args.saleId;
        trx = await this.ordersContract.cancelSaleOrder(saleId);
        checkIfEventEmitted(trx?.logs, "SaleClose", "SaleClose event not generated");
        checkIfEventData(
            trx?.logs,
            "SaleClose",
            "SaleClose event generated but data mismatch error",
            {
                saleId: saleId,
            }
        );
    });

    it("Sale tokens should belong to single record only", async function () {
        await this.treasuryContract.setApprovalForAll(this.ordersContract.address, true);
        await tryCatch(
            this.ordersContract.createSaleOrder(
                false,
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                100,
                1,
                GOVERNANCE_TOKEN_ID + 2, //Invalid Governance token id
                5,
                2
            )
        );
    });

    it("Should able to purchase non locked asset", async function () {
        await this.treasuryContract.setApprovalForAll(this.ordersContract.address, true);

        let trx = await this.ordersContract.createSaleOrder(
            false,
            RECORD_ID,
            COMMUNITY_TOKEN_ID,
            100,
            1,
            GOVERNANCE_TOKEN_ID,
            5,
            2
        );
        let saleId = trx?.logs[0].args.saleId;
        checkIfEventEmitted(trx?.logs, "SaleOrder", "SaleOrder event not generated");
        checkIfEventData(
            trx?.logs,
            "SaleOrder",
            "SaleOrder event generated but data mismatch error",
            {
                seller: await helper.getEthAccount(0),
                isLockedInRatio: false,
            }
        );

        trx = await this.ordersContract.purchaseSaleOrder(
            saleId, //SaleId
            1, //governanceTokenAmount
            1, //governanceTokenPrice
            50, //communityTokenAmount
            1, //communityTokenPrice
            { from: await helper.getEthAccount(1) }
        );

        checkIfEventEmitted(trx?.logs, "SaleBought", "SaleBought event not generated");
        checkIfEventData(
            trx?.logs,
            "SaleBought",
            "SaleBought event generated but data mismatch error",
            {
                saleId: saleId,
            }
        );

        assert(
            (await treasuryContract.balanceOf(await helper.getEthAccount(1), COMMUNITY_TOKEN_ID)) ==
                50,
            "Final balance after community token transfer doesn't match"
        );

        assert(
            (await treasuryContract.balanceOf(
                await helper.getEthAccount(1),
                GOVERNANCE_TOKEN_ID
            )) == 1,
            "Final balance after governance token transfer doesn't match"
        );

        // trx = await this.ordersContract.cancelSaleOrder(trx?.logs[0].args.saleId);
        // checkIfEventEmitted(trx?.logs, "SaleClose", "SaleClose event not generated");
        // checkIfEventData(
        //     trx?.logs,
        //     "SaleClose",
        //     "SaleClose event generated but data mismatch error",
        //     {
        //         saleId: trx?.logs[0].args.saleId,
        //     }
        // );
    });
});

