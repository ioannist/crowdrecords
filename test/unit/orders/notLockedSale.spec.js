const setup = require("../../utils/deployContracts");
const {
    generateTokens,
    SEED_CONTRIBUTION_ID,
    NEW_CONTRIBUTION_1_ID,
    RECORD_ID,
    COMMUNITY_TOKEN_ID,
    GOVERNANCE_TOKEN_ID,
    COMMUNITY_TOKEN_BALANCE_USER1,
    GOVERNANCE_TOKEN_BALANCE_USER1,
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

contract("Not Ratio Locked Sales", function () {
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

    it("User can create normal sale request and cancel it", async function () {
        await this.treasuryContract.setApprovalForAll(this.ordersContract.address, true);

        let trx = await this.ordersContract.createBuyOrder(
            false,
            RECORD_ID,
            COMMUNITY_TOKEN_ID,
            100,
            1,
            GOVERNANCE_TOKEN_ID,
            5,
            2
        );
        checkIfEventEmitted(trx?.logs, "BuyOrder", "BuyOrder event not generated");
        checkIfEventData(
            trx?.logs,
            "BuyOrder",
            "BuyOrder event generated but data mismatch error",
            {
                seller: await helper.getEthAccount(0),
                isLockedInRatio: false,
            }
        );

        let saleId = trx?.logs[0].args.saleId;
        trx = await this.ordersContract.cancelBuyOrder(saleId);
        checkIfEventEmitted(trx?.logs, "BuyClose", "BuyClose event not generated");
        checkIfEventData(
            trx?.logs,
            "BuyClose",
            "BuyClose event generated but data mismatch error",
            {
                saleId: saleId,
            }
        );

        assert(
            (await this.treasuryContract.balanceOf(
                await helper.getEthAccount(0),
                COMMUNITY_TOKEN_ID
            )) == COMMUNITY_TOKEN_BALANCE_USER1,
            "The community tokens of the canceled sale have not returned"
        );

        assert(
            (await this.treasuryContract.balanceOf(
                await helper.getEthAccount(0),
                GOVERNANCE_TOKEN_ID
            )) == GOVERNANCE_TOKEN_BALANCE_USER1,
            "The governance tokens of the canceled sale have not returned"
        );
    });

    it("Sale tokens should belong to single record only", async function () {
        await this.treasuryContract.setApprovalForAll(this.ordersContract.address, true);
        await tryCatch(
            this.ordersContract.createBuyOrder(
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

    it("Should able to purchase non locked asset and sale should close", async function () {
        //Seller Approval
        await this.treasuryContract.setApprovalForAll(this.ordersContract.address, true);
        //Purchaser Approval
        await this.treasuryContract.setApprovalForAll(this.ordersContract.address, true, {
            from: await helper.getEthAccount(1),
        });

        //Transferring CRD token so other account can purchase the tokens
        await this.treasuryContract.safeTransferFrom(
            await helper.getEthAccount(0),
            await helper.getEthAccount(1),
            await this.treasuryContract.CRD(),
            100000,
            "0x0"
        );

        let trx = await this.ordersContract.createBuyOrder(
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
        checkIfEventEmitted(trx?.logs, "BuyOrder", "BuyOrder event not generated");
        checkIfEventData(
            trx?.logs,
            "BuyOrder",
            "BuyOrder event generated but data mismatch error",
            {
                buyer: await helper.getEthAccount(0),
                isLockedInRatio: false,
            }
        );

        //-----------------------------------------------------------------------------//
        // Here we are performing partial transfer
        // That is we will only purchase some amount of the order
        trx = await this.ordersContract.purchaseBuyOrder(
            saleId, //SaleId
            1, //governanceTokenAmount
            50, //communityTokenAmount
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
            (await this.treasuryContract.balanceOf(
                await helper.getEthAccount(1),
                COMMUNITY_TOKEN_ID
            )) == 50,
            "Final balance after community token transfer doesn't match"
        );

        assert(
            (await this.treasuryContract.balanceOf(
                await helper.getEthAccount(1),
                GOVERNANCE_TOKEN_ID
            )) == 1,
            "Final balance after governance token transfer doesn't match"
        );

        //-----------------------------------------------------------------------------//
        // Here we will purchase all the remaining asset and it should result in sale close event genration
        trx = await this.ordersContract.purchaseBuyOrder(
            saleId, //SaleId
            4, //governanceTokenAmount
            50, //communityTokenAmount
            { from: await helper.getEthAccount(1) }
        );

        assert(
            (await this.treasuryContract.balanceOf(
                await helper.getEthAccount(1),
                COMMUNITY_TOKEN_ID
            )) == 100,
            "Final balance after community token transfer doesn't match"
        );

        assert(
            (await this.treasuryContract.balanceOf(
                await helper.getEthAccount(1),
                GOVERNANCE_TOKEN_ID
            )) == 5,
            "Final balance after governance token transfer doesn't match"
        );

        checkIfEventEmitted(trx?.logs, "BuyClose", "BuyClose event not generated");
        checkIfEventData(
            trx?.logs,
            "BuyClose",
            "BuyClose event generated but data mismatch error",
            {
                saleId: trx?.logs[0].args.saleId,
            }
        );
    });
});

