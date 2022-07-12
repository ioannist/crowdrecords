const setup = require("../../utils/deployContracts");
const {
    generateTokens,
    SEED_CONTRIBUTION_ID,
    NEW_CONTRIBUTION_1_ID,
    RECORD_ID,
    COMMUNITY_TOKEN_ID,
    GOVERNANCE_TOKEN_ID,
    GOVERNANCE_TOKEN_BALANCE_USER1,
    COMMUNITY_TOKEN_BALANCE_USER1,
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

contract("Ratio Locked Sales", function () {
    before(setup);
    before(generateTokens);

    //Todo : Test cases
    // creating buy request and locking CRD
    // create buy user from multiple user and locking CRD and checking the total
    //creating buy sale without sufficient CRD, expect revert
    //completing a buy order
    // trying to complete buy order without sufficient token, expect revert
    // trying to complete buy order but only have sufficient COMMUNITY token, expect revert
    // trying to complete buy order but only have sufficient GOVERNANCE token, expect revert
    // trying to fullfil order with incorrect ratio, expect revert
    // trying to purchase token of different records in single sale, expect revert
    // checking if the events are being emitted during the order creation
    // checking if the events are being emitted during order fullfil

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

        let trx = await this.ordersContract.createBuyOrder(
            true,
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
                buyer: await helper.getEthAccount(0),
                isLockedInRatio: true,
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
                true,
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

    it("Should not be able to purchase locked asset if the ratio is wrong", async function () {
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
            true,
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
                seller: await helper.getEthAccount(0),
                isLockedInRatio: true,
            }
        );

        // Here we are performing wrong ratio transfer it should be reject.
        await tryCatch(
            this.ordersContract.purchaseBuyOrder(
                saleId, //SaleId
                1, //governanceTokenAmount
                50, //communityTokenAmount
                { from: await helper.getEthAccount(1) }
            )
        );
    });

    it("Should able to purchase locked asset and sale should close", async function () {
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
            true,
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
                seller: await helper.getEthAccount(0),
                isLockedInRatio: true,
            }
        );

        //-----------------------------------------------------------------------------//
        // Here we are performing partial transfer
        // That is we will only purchase some amount of the order
        trx = await this.ordersContract.purchaseBuyOrder(
            saleId, //SaleId
            4, //governanceTokenAmount
            80, //communityTokenAmount
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
            )) == 80,
            "Final balance after community token transfer doesn't match"
        );

        assert(
            (await this.treasuryContract.balanceOf(
                await helper.getEthAccount(1),
                GOVERNANCE_TOKEN_ID
            )) == 4,
            "Final balance after governance token transfer doesn't match"
        );

        //-----------------------------------------------------------------------------//
        // Here we will purchase all the remaining asset and it should result in sale close event genration
        trx = await this.ordersContract.purchaseBuyOrder(
            saleId, //SaleId
            1, //governanceTokenAmount
            20, //communityTokenAmount
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

        checkIfEventEmitted(trx?.logs, "OrderClose", "OrderClose event not generated");
        checkIfEventData(
            trx?.logs,
            "OrderClose",
            "OrderClose event generated but data mismatch error",
            {
                saleId: trx?.logs[0].args.saleId,
            }
        );
    });
});

