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

        let trx = await this.ordersContract.createBuyOrder([
            false,
            RECORD_ID,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("100"),
            await web3.utils.toWei((100 * 1).toString()),
            GOVERNANCE_TOKEN_ID,
            await web3.utils.toWei("5"),
            await web3.utils.toWei((5 * 2).toString()),
        ]);
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

    it("User can create normal Buy request, cancels it, other user tries to buy order expect revert.", async function() {
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        await this.treasuryCoreContract.setApprovalForAll(this.ordersContract.address, true, {
            from: user1,
        });

        let trx = await this.ordersContract.createBuyOrder([
            false,
            RECORD_ID,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("100"),
            await web3.utils.toWei((100 * 1).toString()),
            GOVERNANCE_TOKEN_ID,
            await web3.utils.toWei("5"),
            await web3.utils.toWei((5 * 2).toString()),
        ]);
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

        await expect(
            this.ordersContract.acceptBuyOrder(
                saleId, //SaleId
                await web3.utils.toWei("50"), //communityTokenAmount
                await web3.utils.toWei("1"), //governanceTokenAmount
                { from: user2 }
            )
        ).to.eventually.be.rejectedWith("INVALID: ORDER_CLOSED");
    });

    it("Trying to sell more then the requested amount, expect revert", async function() {
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        await this.treasuryCoreContract.setApprovalForAll(this.ordersContract.address, true, {
            from: user1,
        });

        let trx = await this.ordersContract.createBuyOrder([
            false,
            RECORD_ID,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("100"),
            await web3.utils.toWei((100 * 1).toString()),
            GOVERNANCE_TOKEN_ID,
            await web3.utils.toWei("5"),
            await web3.utils.toWei((5 * 2).toString()),
        ]);
        expectEvent(trx, "BuyOrder", {
            buyer: user1,
            isLockedInRatio: false,
        });

        let saleId = trx?.logs[0].args.saleId.toString();

        await expect(
            this.ordersContract.acceptBuyOrder(
                saleId, //SaleId
                await web3.utils.toWei("500"), //communityTokenAmount
                await web3.utils.toWei("1"), //governanceTokenAmount
                { from: user2 }
            )
        ).to.eventually.be.rejectedWith("INSUFFICIENT: COMMUNITY_TOKEN_AMOUNT");

        await expect(
            this.ordersContract.acceptBuyOrder(
                saleId, //SaleId
                await web3.utils.toWei("50"), //communityTokenAmount
                await web3.utils.toWei("10"), //governanceTokenAmount
                { from: user2 }
            )
        ).to.eventually.be.rejectedWith("INSUFFICIENT: GOVERNANCE_TOKEN_AMOUNT");
    });

    it("Create buy order with 999,000 CRD total order value.", async function() {
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        await this.treasuryCoreContract.setApprovalForAll(this.ordersContract.address, true, {
            from: user1,
        });
        await this.treasuryCoreContract.setApprovalForAll(this.ordersContract.address, true, {
            from: user2,
        });

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            CRDTokenId,
            await web3.utils.toWei("1000000"),
            "0x0"
        );

        let trx = await this.ordersContract.createBuyOrder(
            [
                false,
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("990"),
                await web3.utils.toWei((990 * 1000).toString()),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("9"),
                await web3.utils.toWei((9 * 1000).toString()),
            ],
            { from: user2 }
        );
        expectEvent(trx, "BuyOrder", {
            buyer: user2,
            isLockedInRatio: false,
        });

        let saleId = trx?.logs[0].args.saleId.toString();

        await this.ordersContract.acceptBuyOrder(
            saleId, //SaleId
            await web3.utils.toWei("990"), //communityTokenAmount
            await web3.utils.toWei("9"), //governanceTokenAmount
            { from: user1 }
        );

        // Checking wether the user1 received the correct amount that is after
        // deduction of the fess.
        await expect(
            this.treasuryContract.balanceOf(user1, CRDTokenId)
        ).to.eventually.be.bignumber.equals(await web3.utils.toWei("994005"));

        // Checking the wallet for the transaction cut balance
        await expect(
            this.treasuryContract.balanceOf(await this.ordersContract.WALLET_ADDRESS(), CRDTokenId)
        ).to.eventually.be.bignumber.equals(await web3.utils.toWei("4995"));
    });

    it("Sale tokens should belong to same record, expect revert", async function() {
        await this.treasuryCoreContract.setApprovalForAll(this.ordersContract.address, true);
        await expect(
            this.ordersContract.createBuyOrder([
                false,
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("100"),
                await web3.utils.toWei((100 * 1).toString()),
                GOVERNANCE_TOKEN_ID + 2, //INVALID: GOVERNANCE_TOKEN_ID
                await web3.utils.toWei("5"),
                await web3.utils.toWei((5 * 2).toString()),
            ])
        ).to.eventually.be.rejectedWith("INVALID: GOVERNANCE_TOKEN_ID");
        await expect(
            this.ordersContract.createBuyOrder([
                false,
                RECORD_ID,
                COMMUNITY_TOKEN_ID + 2, //INVALID: COMMUNITY_TOKEN_ID
                await web3.utils.toWei("100"),
                await web3.utils.toWei((100 * 1).toString()),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("5"),
                await web3.utils.toWei((5 * 2).toString()),
            ])
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
            [
                false,
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("100"),
                await web3.utils.toWei((100 * 1).toString()),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("5"),
                await web3.utils.toWei((5 * 2).toString()),
            ],
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
            await web3.utils.toWei("50"), //communityTokenAmount
            await web3.utils.toWei("1"), //governanceTokenAmount
            { from: user1 }
        );

        expectEvent(trx, "SaleBought", {
            saleId: saleId,
        });

        await expect(
            this.treasuryContract.balanceOf(user2, COMMUNITY_TOKEN_ID)
        ).to.eventually.be.bignumber.equal(web3.utils.toWei("50"));

        await expect(
            this.treasuryContract.balanceOf(user2, GOVERNANCE_TOKEN_ID)
        ).to.eventually.be.bignumber.equal(web3.utils.toWei("1"));

        //-----------------------------------------------------------------------------//
        // Here we will purchase all the remaining asset and it should result in sale close event generation
        trx = await this.ordersContract.acceptBuyOrder(
            saleId, //SaleId
            await web3.utils.toWei("50"), //communityTokenAmount
            await web3.utils.toWei("4"), //governanceTokenAmount
            { from: user1 }
        );

        await expect(
            this.treasuryContract.balanceOf(user2, COMMUNITY_TOKEN_ID)
        ).to.eventually.be.bignumber.equal(web3.utils.toWei("100"));

        await expect(
            this.treasuryContract.balanceOf(user2, GOVERNANCE_TOKEN_ID)
        ).to.eventually.be.bignumber.equal(web3.utils.toWei("5"));

        expectEvent(trx, "OrderClose", {
            saleId: saleId,
        });
    });

    it("Should able to purchase non locked asset with decimal values and sale should close", async function() {
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
            [
                false,
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("504.58"),
                await web3.utils.toWei((504.58 * 3.5).toString()),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("575.5645"),
                await web3.utils.toWei((575.5645 * 1.5).toString()),
            ],
            { from: user2 }
        );
        let saleId = trx?.logs[0].args.saleId;
        expectEvent(trx, "BuyOrder", {
            buyer: user2,
            isLockedInRatio: false,
        });

        //-----------------------------------------------------------------------------//
        // Purchase asset partially
        trx = await this.ordersContract.acceptBuyOrder(
            saleId, //SaleId
            await web3.utils.toWei("51.11"), //communityTokenAmount
            await web3.utils.toWei("523.0"), //governanceTokenAmount
            { from: user1 }
        );

        expectEvent(trx, "SaleBought", {
            saleId: saleId,
            buyer: user1,
            seller: user2,
        });

        await expect(
            this.treasuryContract.balanceOf(user2, COMMUNITY_TOKEN_ID)
        ).to.eventually.be.bignumber.equal(web3.utils.toWei("51.11"));

        await expect(
            this.treasuryContract.balanceOf(user2, GOVERNANCE_TOKEN_ID)
        ).to.eventually.be.bignumber.equal(web3.utils.toWei("523.0"));

        //-----------------------------------------------------------------------------//
        // Purchase asset partially
        trx = await this.ordersContract.acceptBuyOrder(
            saleId, //SaleId
            await web3.utils.toWei("122.2199"), //communityTokenAmount
            await web3.utils.toWei("45.51"), //governanceTokenAmount
            { from: user1 }
        );

        expectEvent(trx, "SaleBought", {
            saleId: saleId,
            buyer: user1,
            seller: user2,
        });

        await expect(
            this.treasuryContract.balanceOf(user2, COMMUNITY_TOKEN_ID)
        ).to.eventually.be.bignumber.equal(web3.utils.toWei("173.3299"));

        await expect(
            this.treasuryContract.balanceOf(user2, GOVERNANCE_TOKEN_ID)
        ).to.eventually.be.bignumber.equal(web3.utils.toWei("568.51"));

        //-----------------------------------------------------------------------------//
        // Purchase asset partially
        trx = await this.ordersContract.acceptBuyOrder(
            saleId, //SaleId
            await web3.utils.toWei("331.2501"), //communityTokenAmount
            await web3.utils.toWei("7.0545"), //governanceTokenAmount
            { from: user1 }
        );

        expectEvent(trx, "SaleBought", {
            saleId: saleId,
            seller: user2,
            buyer: user1,
        });

        await expect(
            this.treasuryContract.balanceOf(user2, COMMUNITY_TOKEN_ID)
        ).to.eventually.be.bignumber.equal(web3.utils.toWei("504.58"));

        await expect(
            this.treasuryContract.balanceOf(user2, GOVERNANCE_TOKEN_ID)
        ).to.eventually.be.bignumber.equal(web3.utils.toWei("575.5645"));

        expectEvent(trx, "OrderClose", {
            saleId: saleId,
        });
    });

    it("Should able to purchase non locked asset the buy order is less than 1", async function() {
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
            [
                false,
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("0.1"),
                await web3.utils.toWei((0.1 * 55.9).toString()),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("0.5"),
                await web3.utils.toWei((0.5 * 55.017).toString()),
            ],
            { from: user2 }
        );
        let saleId = trx?.logs[0].args.saleId;
        expectEvent(trx, "BuyOrder", {
            buyer: user2,
            isLockedInRatio: false,
        });

        //-----------------------------------------------------------------------------//
        // Purchase asset completely
        trx = await this.ordersContract.acceptBuyOrder(
            saleId, //SaleId
            await web3.utils.toWei("0.1"), //communityTokenAmount
            await web3.utils.toWei("0.5"), //governanceTokenAmount
            { from: user1 }
        );

        expectEvent(trx, "SaleBought", {
            saleId: saleId,
            buyer: user1,
            seller: user2,
        });

        assert(
            (await this.treasuryContract.balanceOf(user2, COMMUNITY_TOKEN_ID)) ==
                (await web3.utils.toWei("0.1")),
            "Final balance after community token transfer doesn't match"
        );

        assert(
            (await this.treasuryContract.balanceOf(user2, GOVERNANCE_TOKEN_ID)) ==
                (await web3.utils.toWei("0.5")),
            "Final balance after governance token transfer doesn't match"
        );

        expectEvent(trx, "OrderClose", {
            saleId: saleId,
        });
    });

    it("Should able to purchase non locked asset the CRD amount is less than 1", async function() {
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
            [
                false,
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("0.5"),
                await web3.utils.toWei((0.5 * 0.19).toString()),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("0.5"),
                await web3.utils.toWei((0.5 * 0.89).toString()),
            ],
            { from: user2 }
        );
        let saleId = trx?.logs[0].args.saleId;
        expectEvent(trx, "BuyOrder", {
            buyer: user2,
            isLockedInRatio: false,
        });

        //-----------------------------------------------------------------------------//
        // Purchase asset completely
        trx = await this.ordersContract.acceptBuyOrder(
            saleId, //SaleId
            await web3.utils.toWei("0.5"), //communityTokenAmount
            await web3.utils.toWei("0.5"), //governanceTokenAmount
            { from: user1 }
        );

        expectEvent(trx, "SaleBought", {
            saleId: saleId,
            buyer: user1,
            seller: user2,
        });

        await expect(
            this.treasuryContract.balanceOf(user2, COMMUNITY_TOKEN_ID)
        ).to.eventually.be.bignumber.equal(web3.utils.toWei("0.5"));

        await expect(
            this.treasuryContract.balanceOf(user2, GOVERNANCE_TOKEN_ID)
        ).to.eventually.be.bignumber.equal(web3.utils.toWei("0.5"));

        expectEvent(trx, "OrderClose", {
            saleId: saleId,
        });
    });

    it("Buy order is fulfilled and the transaction fees are transferred to wallet", async function() {
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
            [
                false,
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("0.5"),
                await web3.utils.toWei((0.5 * 0.19).toString()),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("0.5"),
                await web3.utils.toWei((0.5 * 0.89).toString()),
            ],
            { from: user2 }
        );
        let saleId = trx?.logs[0].args.saleId;
        expectEvent(trx, "BuyOrder", {
            buyer: user2,
            isLockedInRatio: false,
        });

        //-----------------------------------------------------------------------------//
        // Purchase asset completely
        trx = await this.ordersContract.acceptBuyOrder(
            saleId, //SaleId
            await web3.utils.toWei("0.5"), //communityTokenAmount
            await web3.utils.toWei("0.5"), //governanceTokenAmount
            { from: user1 }
        );

        expectEvent(trx, "SaleBought", {
            saleId: saleId,
            buyer: user1,
            seller: user2,
        });

        await expect(
            this.treasuryContract.balanceOf(user2, COMMUNITY_TOKEN_ID)
        ).to.eventually.be.bignumber.equal(web3.utils.toWei("0.5"));

        await expect(
            this.treasuryContract.balanceOf(user2, GOVERNANCE_TOKEN_ID)
        ).to.eventually.be.bignumber.equal(web3.utils.toWei("0.5"));

        expectEvent(trx, "OrderClose", {
            saleId: saleId,
        });

        const totalFee = (helper.SALE_TRANSACTION_FEE_PERCENT * (0.5 * 0.19 + 0.5 * 0.89)) / 100;

        await expect(
            this.treasuryContract.balanceOf(
                await this.ordersContract.WALLET_ADDRESS(),
                await this.treasuryContract.CRD()
            )
        ).to.eventually.be.bignumber.equal(web3.utils.toWei(totalFee.toString()));
    });

    it("Buy order is fulfilled and the transaction fees are transferred to wallet. Order amount is greater than 1", async function() {
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
            [
                false,
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("157"),
                await web3.utils.toWei((157 * 0.19).toString()),
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("157"),
                await web3.utils.toWei((157 * 0.89).toString()),
            ],
            { from: user2 }
        );
        let saleId = trx?.logs[0].args.saleId;
        expectEvent(trx, "BuyOrder", {
            buyer: user2,
            isLockedInRatio: false,
        });

        //-----------------------------------------------------------------------------//
        // Purchase asset completely
        trx = await this.ordersContract.acceptBuyOrder(
            saleId, //SaleId
            await web3.utils.toWei("157"), //communityTokenAmount
            await web3.utils.toWei("157"), //governanceTokenAmount
            { from: user1 }
        );

        expectEvent(trx, "SaleBought", {
            saleId: saleId,
            buyer: user1,
            seller: user2,
        });

        await expect(
            this.treasuryContract.balanceOf(user2, COMMUNITY_TOKEN_ID)
        ).to.eventually.be.bignumber.equal(web3.utils.toWei("157"));

        await expect(
            this.treasuryContract.balanceOf(user2, GOVERNANCE_TOKEN_ID)
        ).to.eventually.be.bignumber.equal(web3.utils.toWei("157"));

        expectEvent(trx, "OrderClose", {
            saleId: saleId,
        });

        const totalFee = (helper.SALE_TRANSACTION_FEE_PERCENT * (157 * 0.19 + 157 * 0.89)) / 100;

        await expect(
            this.treasuryContract.balanceOf(
                await this.ordersContract.WALLET_ADDRESS(),
                await this.treasuryContract.CRD()
            )
        ).to.eventually.be.bignumber.equal(web3.utils.toWei(totalFee.toString()));
    });
});

