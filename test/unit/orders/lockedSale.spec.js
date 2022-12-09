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

/**
 * For all the test cases the input amount precision is only of 6 decimal digits, anything beyond 6 digits will not be either considered or would throw error in test cases
 */
contract("Ratio Locked Sales", function() {
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

    it("User can create lock sale request and cancel it", async function() {
        await this.treasuryCoreContract.setApprovalForAll(this.ordersContract.address, true);

        let trx = await this.ordersContract.createBuyOrder([
            true,
            RECORD_ID,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("100"),
            await web3.utils.toWei("1"),
            GOVERNANCE_TOKEN_ID,
            await web3.utils.toWei("5"),
            await web3.utils.toWei("2"),
        ]);
        expectEvent(trx, "BuyOrder", {
            buyer: await helper.getEthAccount(0),
            isLockedInRatio: true,
        });

        let saleId = trx?.logs[0].args.saleId;
        trx = await this.ordersContract.cancelBuyOrder(saleId);

        expectEvent(trx, "OrderClose", {
            saleId: saleId,
        });

        //The CRD tokens that were transferred to ordersContract needs to be returned
        await expect(
            this.treasuryContract.balanceOf(await helper.getEthAccount(0), CRDTokenId)
        ).to.eventually.be.bignumber.equals(await web3.utils.toWei("1000000"));
    });

    it("Sale tokens should belong to single record only", async function() {
        await this.treasuryCoreContract.setApprovalForAll(this.ordersContract.address, true);
        await expect(
            this.ordersContract.createBuyOrder([
                true,
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
                true,
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

    it("Cannot create buy order without sufficient CRD, expect revert", async function() {
        const user4 = await helper.getEthAccount(3);
        await this.treasuryCoreContract.setApprovalForAll(this.ordersContract.address, true, {
            from: user4,
        });
        await expect(
            this.ordersContract.createBuyOrder(
                [
                    true,
                    RECORD_ID,
                    COMMUNITY_TOKEN_ID,
                    await web3.utils.toWei("100"),
                    await web3.utils.toWei((100 * 1).toString()),
                    GOVERNANCE_TOKEN_ID,
                    await web3.utils.toWei("5"),
                    await web3.utils.toWei((5 * 2).toString()),
                ],
                { from: user4 }
            )
        ).to.eventually.be.rejectedWith("ERC1155: insufficient balance for transfer");
    });

    describe("With locked asset purchase order", function() {
        let snapShot2, snapshotId2;
        beforeEach(async function() {
            snapShot2 = await helper.takeSnapshot();
            snapshotId2 = snapShot2["result"];

            this.user1 = await helper.getEthAccount(0);
            this.user2 = await helper.getEthAccount(1);
            this.user3 = await helper.getEthAccount(2);
            this.user4 = await helper.getEthAccount(3);

            //Seller Approval
            await this.treasuryCoreContract.setApprovalForAll(this.ordersContract.address, true);
            //Purchaser Approval
            await this.treasuryCoreContract.setApprovalForAll(this.ordersContract.address, true, {
                from: this.user2,
            });
            await this.treasuryCoreContract.setApprovalForAll(this.ordersContract.address, true, {
                from: this.user3,
            });
            await this.treasuryCoreContract.setApprovalForAll(this.ordersContract.address, true, {
                from: this.user4,
            });

            //Transferring CRD token to user2
            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user2,
                CRDTokenId,
                await web3.utils.toWei("100000"),
                "0x0"
            );

            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user3,
                CRDTokenId,
                await web3.utils.toWei("100000"),
                "0x0"
            );

            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user3,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("10000"),
                "0x0"
            );
            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user3,
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("10000"),
                "0x0"
            );

            let trx = await this.ordersContract.createBuyOrder(
                [
                    true,
                    RECORD_ID,
                    COMMUNITY_TOKEN_ID,
                    await web3.utils.toWei("100"),
                    await web3.utils.toWei((100 * 1).toString()),
                    GOVERNANCE_TOKEN_ID,
                    await web3.utils.toWei("5"),
                    await web3.utils.toWei((5 * 2).toString()),
                ],
                { from: this.user2 }
            );
            this.saleId = trx?.logs[0].args.saleId;
        });
        afterEach(async function() {
            await helper.revertToSnapshot(snapshotId2);
        });

        it("Try to purchase self order, expect revert", async function() {
            // Here we are performing wrong ratio transfer it should be reject.
            await expect(
                this.ordersContract.acceptBuyOrder(
                    this.saleId, //SaleId
                    await web3.utils.toWei("50"), //communityTokenAmount
                    await web3.utils.toWei("1"), //governanceTokenAmount
                    { from: this.user2 }
                )
            ).to.eventually.be.rejectedWith("INVALID: CANNOT_PURCHASE_SELF_ORDER");
        });

        it("Try to fulfill order with insufficient Community token balance, expect revert", async function() {
            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user4,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("10000"),
                "0x0"
            );

            // Here we have sufficient community tokens but we lack governance tokens, expect revert
            await expect(
                this.ordersContract.acceptBuyOrder(
                    this.saleId, //SaleId
                    await web3.utils.toWei("50"), //communityTokenAmount
                    await web3.utils.toWei("2.5"), //governanceTokenAmount
                    { from: this.user4 }
                )
            ).to.eventually.be.rejectedWith("ERC1155: insufficient balance for transfer");
        });
        it("Try to fulfill order with insufficient governance token balance, expect revert", async function() {
            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user4,
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("10000"),
                "0x0"
            );

            // Here we have sufficient governance tokens but we lack community tokens, expect revert
            await expect(
                this.ordersContract.acceptBuyOrder(
                    this.saleId, //SaleId
                    await web3.utils.toWei("50"), //communityTokenAmount
                    await web3.utils.toWei("2.5"), //governanceTokenAmount
                    { from: this.user4 }
                )
            ).to.eventually.be.rejectedWith("ERC1155: insufficient balance for transfer");
        });

        it("Should not be able to purchase locked asset if the ratio is wrong, expect revert", async function() {
            // Here we are performing wrong ratio transfer it should be reject.
            await expect(
                this.ordersContract.acceptBuyOrder(
                    this.saleId, //SaleId
                    await web3.utils.toWei("50"), //communityTokenAmount
                    await web3.utils.toWei("1"), //governanceTokenAmount
                    { from: this.user1 }
                )
            ).to.eventually.be.rejectedWith("INVALID: TOKEN_RATIO");

            await expect(
                this.ordersContract.acceptBuyOrder(
                    this.saleId, //SaleId
                    await web3.utils.toWei("1"), //communityTokenAmount
                    await web3.utils.toWei("1"), //governanceTokenAmount
                    { from: this.user1 }
                )
            ).to.eventually.be.rejectedWith("INVALID: TOKEN_RATIO");
        });

        it("Should not be able to purchase locked asset if the ratio is wrong, expect revert", async function() {
            let trx = await this.ordersContract.createBuyOrder(
                [
                    true,
                    RECORD_ID,
                    COMMUNITY_TOKEN_ID,
                    await web3.utils.toWei("100000"),
                    await web3.utils.toWei((100000 * 1).toString()),
                    GOVERNANCE_TOKEN_ID,
                    await web3.utils.toWei("0.1"),
                    await web3.utils.toWei((0.1 * 2).toString()),
                ],
                { from: this.user1 }
            );

            let saleId = trx?.logs[0].args.saleId;
            // Here we are performing wrong ratio transfer it should be reject.
            await expect(
                this.ordersContract.acceptBuyOrder(
                    saleId, //SaleId
                    await web3.utils.toWei("1"), //communityTokenAmount
                    await web3.utils.toWei("0.1"), //governanceTokenAmount
                    { from: this.user3 }
                )
            ).to.eventually.be.rejectedWith("INVALID: TOKEN_RATIO");

            await expect(
                this.ordersContract.acceptBuyOrder(
                    saleId, //SaleId
                    await web3.utils.toWei("100"), //communityTokenAmount
                    await web3.utils.toWei("0.001"), //governanceTokenAmount
                    { from: this.user3 }
                )
            ).to.eventually.be.rejectedWith("INVALID: TOKEN_RATIO");
        });

        it("Should not be able to purchase locked asset if the ratio is wrong, expect revert", async function() {
            let trx = await this.ordersContract.createBuyOrder(
                [
                    true,
                    RECORD_ID,
                    COMMUNITY_TOKEN_ID,
                    await web3.utils.toWei("100000"),
                    await web3.utils.toWei((100000 * 0.001).toString()),
                    GOVERNANCE_TOKEN_ID,
                    await web3.utils.toWei("0.1"),
                    await web3.utils.toWei((0.1 * 2).toString()),
                ],
                { from: this.user2 }
            );

            let saleId = trx?.logs[0].args.saleId;
            // Here we are performing wrong ratio transfer it should be reject.
            await this.ordersContract.acceptBuyOrder(
                saleId, //SaleId
                await web3.utils.toWei("5000"), //communityTokenAmount
                await web3.utils.toWei("0.005"), //governanceTokenAmount
                { from: this.user3 }
            );

            await expect(
                this.treasuryContract.balanceOf(this.user2, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(await web3.utils.toWei("5000"));

            await expect(
                this.treasuryContract.balanceOf(this.user2, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(await web3.utils.toWei("0.005"));
        });

        it("Trying to purchase more than available, get's rejected", async function() {
            // Here we are performing wrong ratio transfer it should be reject.
            await expect(
                this.ordersContract.acceptBuyOrder(
                    this.saleId, //SaleId
                    await web3.utils.toWei("5"), //communityTokenAmount
                    await web3.utils.toWei("100"), //governanceTokenAmount
                    { from: this.user1 }
                )
            ).to.eventually.be.rejectedWith("INSUFFICIENT: GOVERNANCE_TOKEN_AMOUNT");

            await expect(
                this.ordersContract.acceptBuyOrder(
                    this.saleId, //SaleId
                    await web3.utils.toWei("500"), //communityTokenAmount
                    await web3.utils.toWei("1"), //governanceTokenAmount
                    { from: this.user1 }
                )
            ).to.eventually.be.rejectedWith("INSUFFICIENT: COMMUNITY_TOKEN_AMOUNT");
        });

        it("Should able to purchase locked asset and sale should close, and event check", async function() {
            //-----------------------------------------------------------------------------//
            // Here we are performing partial transfer
            // That is we will only purchase some amount of the order
            trx = await this.ordersContract.acceptBuyOrder(
                this.saleId, //SaleId
                await web3.utils.toWei("80"), //communityTokenAmount
                await web3.utils.toWei("4"), //governanceTokenAmount
                { from: this.user1 }
            );

            expectEvent(trx, "SaleBought", {
                saleId: this.saleId,
            });

            await expect(
                this.treasuryContract.balanceOf(this.user2, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(await web3.utils.toWei("80"));

            await expect(
                this.treasuryContract.balanceOf(this.user2, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(await web3.utils.toWei("4"));

            //-----------------------------------------------------------------------------//
            // Here we will purchase all the remaining asset and it should result in sale close event genration
            trx = await this.ordersContract.acceptBuyOrder(
                this.saleId, //SaleId
                await web3.utils.toWei("20"), //communityTokenAmount
                await web3.utils.toWei("1"), //governanceTokenAmount
                { from: this.user1 }
            );

            expectEvent(trx, "SaleBought", {
                saleId: this.saleId,
            });

            await expect(
                this.treasuryContract.balanceOf(this.user2, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(await web3.utils.toWei("100"));

            await expect(
                this.treasuryContract.balanceOf(this.user2, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(await web3.utils.toWei("5"));

            expectEvent(trx, "OrderClose", {
                saleId: trx?.logs[0].args.saleId,
            });
        });

        it("Order fulfilled by more than one user", async function() {
            //-----------------------------------------------------------------------------//
            // Here we are performing partial transfer
            // That is we will only purchase some amount of the order
            trx = await this.ordersContract.acceptBuyOrder(
                this.saleId, //SaleId
                await web3.utils.toWei("10"), //communityTokenAmount
                await web3.utils.toWei("0.5"), //governanceTokenAmount
                { from: this.user1 }
            );

            expectEvent(trx, "SaleBought", {
                saleId: this.saleId,
            });

            await expect(
                this.treasuryContract.balanceOf(this.user2, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(await web3.utils.toWei("10"));

            await expect(
                this.treasuryContract.balanceOf(this.user2, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(await web3.utils.toWei("0.5"));

            //-----------------------------------------------------------------------------//
            // Here we will purchase all the remaining asset and it should result in sale close event genration
            trx = await this.ordersContract.acceptBuyOrder(
                this.saleId, //SaleId
                await web3.utils.toWei("90"), //communityTokenAmount
                await web3.utils.toWei("4.5"), //governanceTokenAmount
                { from: this.user3 }
            );

            expectEvent(trx, "SaleBought", {
                saleId: this.saleId,
            });

            await expect(
                this.treasuryContract.balanceOf(this.user2, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(await web3.utils.toWei("100"));

            await expect(
                this.treasuryContract.balanceOf(this.user2, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(await web3.utils.toWei("5"));

            expectEvent(trx, "OrderClose", {
                saleId: trx?.logs[0].args.saleId,
            });
        });

        it("Check platform fee amount", async function() {
            //-----------------------------------------------------------------------------//
            // Here we are performing partial transfer
            // That is we will only purchase some amount of the order
            trx = await this.ordersContract.acceptBuyOrder(
                this.saleId, //SaleId
                await web3.utils.toWei("10"), //communityTokenAmount
                await web3.utils.toWei("0.5"), //governanceTokenAmount
                { from: this.user1 }
            );

            expectEvent(trx, "SaleBought", {
                saleId: this.saleId,
            });

            await expect(
                this.treasuryContract.balanceOf(this.user2, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(await web3.utils.toWei("10"));

            await expect(
                this.treasuryContract.balanceOf(this.user2, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(await web3.utils.toWei("0.5"));

            //-----------------------------------------------------------------------------//
            // Here we will purchase all the remaining asset and it should result in sale close event genration
            trx = await this.ordersContract.acceptBuyOrder(
                this.saleId, //SaleId
                await web3.utils.toWei("90"), //communityTokenAmount
                await web3.utils.toWei("4.5"), //governanceTokenAmount
                { from: this.user3 }
            );

            expectEvent(trx, "SaleBought", {
                saleId: this.saleId,
            });

            await expect(
                this.treasuryContract.balanceOf(this.user2, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(await web3.utils.toWei("100"));

            await expect(
                this.treasuryContract.balanceOf(this.user2, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(await web3.utils.toWei("5"));

            expectEvent(trx, "OrderClose", {
                saleId: trx?.logs[0].args.saleId,
            });

            const totalFee = (helper.SALE_TRANSACTION_FEE_PERCENT * (100 * 1 + 5 * 2)) / 100;

            await expect(
                this.treasuryContract.balanceOf(
                    await this.ordersContract.WALLET_ADDRESS(),
                    await this.treasuryContract.CRD()
                )
            ).to.eventually.be.bignumber.equal(web3.utils.toWei(totalFee.toString()));
        });

        it("Should able to purchase locked asset with decimal values and sale should close", async function() {
            user1 = await helper.getEthAccount(0);
            user2 = await helper.getEthAccount(1);

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
                    true,
                    RECORD_ID,
                    COMMUNITY_TOKEN_ID,
                    await web3.utils.toWei("10.5160"),
                    await web3.utils.toWei("1"),
                    GOVERNANCE_TOKEN_ID,
                    await web3.utils.toWei("4.6100"),
                    await web3.utils.toWei("2"),
                ],
                { from: user2 }
            );
            const saleId = trx?.logs[0].args.saleId;

            //-----------------------------------------------------------------------------//
            // Purchase all the remaining tokens

            trx = await this.ordersContract.acceptBuyOrder(
                saleId, //SaleId
                await web3.utils.toWei("10.5160"), //communityTokenAmount
                await web3.utils.toWei("4.6100"), //governanceTokenAmount
                { from: user1 }
            );

            expectEvent(trx, "SaleBought", {
                saleId: saleId,
            });

            await expect(
                this.treasuryContract.balanceOf(user2, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(await web3.utils.toWei("10.5160"));

            await expect(
                this.treasuryContract.balanceOf(user2, GOVERNANCE_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(await web3.utils.toWei("4.6100"));

            expectEvent(trx, "OrderClose", {
                saleId: trx?.logs[0].args.saleId,
            });
        });
    });
});

