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
const chai = require("chai");
const BN = require("bn.js");
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const { expectRevert } = require("@openzeppelin/test-helpers");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

contract("Not Ratio Locked Sales", function() {
    before(setup);
    before(generateTokens);

    const CRDTokenId = 1;
    let snapShot, snapshotId;
    beforeEach(async function() {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot["result"];
    });
    afterEach(async function() {
        await helper.revertToSnapshot(snapshotId);
    });

    it("User can create normal Buy request and cancel it", async function() {
        const user1 = await helper.getEthAccount(0);
        await this.treasuryCoreContract.setApprovalForAll(this.ordersContract.address, true, {
            from: user1,
        });

        let trx = await this.ordersContract.createBuyOrder(
            false,
            RECORD_ID,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("100"),
            1,
            GOVERNANCE_TOKEN_ID,
            await web3.utils.toWei("5"),
            2
        );
        expectEvent(trx, "BuyOrder", {
            buyer: user1,
            isLockedInRatio: false,
        });

        let saleId = trx?.logs[0].args.saleId.toString();
        trx = await this.ordersContract.cancelBuyOrder(1, { from: user1 });

        expectEvent(trx, "OrderClose", {
            saleId: saleId,
        });

        //The CRD tokens that were transferred to ordersContract needs to be returned
        await expect(
            this.treasuryContract.balanceOf(user1, CRDTokenId)
        ).to.eventually.be.bignumber.equals(await web3.utils.toWei("1000000"));
    });

    it("Sale tokens should belong to same record, expect revert", async function() {
        await this.treasuryCoreContract.setApprovalForAll(this.ordersContract.address, true);
        await expect(
            this.ordersContract.createBuyOrder(
                false,
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("100"),
                1,
                GOVERNANCE_TOKEN_ID + 2, //INVALID: GOVERNANCE_TOKEN_ID
                await web3.utils.toWei("5"),
                2
            )
        ).to.eventually.be.rejectedWith("INVALID: GOVERNANCE_TOKEN_ID");
        await expect(
            this.ordersContract.createBuyOrder(
                false,
                RECORD_ID,
                COMMUNITY_TOKEN_ID + 2, //INVALID: COMMUNITY_TOKEN_ID
                await web3.utils.toWei("100"),
                1,
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("5"),
                2
            )
        ).to.eventually.be.rejectedWith("INVALID: COMMUNITY_TOKEN_ID");
    });

    it("Should able to purchase non locked asset and sale should close", async function() {
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);

        //Seller Approval
        await this.treasuryCoreContract.setApprovalForAll(this.ordersContract.address, true);
        //Purchaser Approval
        await this.treasuryCoreContract.setApprovalForAll(this.ordersContract.address, true, {
            from: user2,
        });

        //Transferring CRD token to user2
        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            CRDTokenId,
            await web3.utils.toWei("100000"),
            "0x0"
        );

        let trx = await this.ordersContract.createBuyOrder(
            false,
            RECORD_ID,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("100"),
            1,
            GOVERNANCE_TOKEN_ID,
            await web3.utils.toWei("5"),
            2,
            { from: user2 }
        );
        let saleId = trx?.logs[0].args.saleId;
        expectEvent(trx, "BuyOrder", {
            buyer: user2,
            isLockedInRatio: false,
        });

        //-----------------------------------------------------------------------------//
        // Here we are performing partial transfer
        // That is we will only purchase some amount of the order
        trx = await this.ordersContract.acceptBuyOrder(
            saleId, //SaleId
            await web3.utils.toWei("1"), //governanceTokenAmount
            await web3.utils.toWei("50"), //communityTokenAmount
            { from: user1 }
        );

        expectEvent(trx, "SaleBought", {
            saleId: saleId,
        });

        assert(
            (await this.treasuryContract.balanceOf(user2, GOVERNANCE_TOKEN_ID)) ==
                (await web3.utils.toWei("1")),
            "Final balance after governance token transfer doesn't match"
        );

        assert(
            (await this.treasuryContract.balanceOf(user2, COMMUNITY_TOKEN_ID)) ==
                (await web3.utils.toWei("50")),
            "Final balance after community token transfer doesn't match"
        );

        //-----------------------------------------------------------------------------//
        // Here we will purchase all the remaining asset and it should result in sale close event generation
        trx = await this.ordersContract.acceptBuyOrder(
            saleId, //SaleId
            await web3.utils.toWei("4"), //governanceTokenAmount
            await web3.utils.toWei("50"), //communityTokenAmount
            { from: user1 }
        );

        assert(
            (await this.treasuryContract.balanceOf(user2, COMMUNITY_TOKEN_ID)) ==
                (await web3.utils.toWei("100")),
            "Final balance after community token transfer doesn't match"
        );

        assert(
            (await this.treasuryContract.balanceOf(user2, GOVERNANCE_TOKEN_ID)) ==
                (await web3.utils.toWei("5")),
            "Final balance after governance token transfer doesn't match"
        );

        expectEvent(trx, "OrderClose", {
            saleId: trx?.logs[0].args.saleId,
        });
    });
});

