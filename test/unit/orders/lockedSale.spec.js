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

    const CRDTokenId = 1;
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
            await web3.utils.toWei("100"),
            1,
            GOVERNANCE_TOKEN_ID,
            await web3.utils.toWei("5"),
            2
        );
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

    it("Sale tokens should belong to single record only", async function () {
        await this.treasuryContract.setApprovalForAll(this.ordersContract.address, true);
        await expect(
            this.ordersContract.createBuyOrder(
                true,
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("100"),
                1,
                GOVERNANCE_TOKEN_ID + 2, //Invalid Governance token id
                await web3.utils.toWei("5"),
                2
            )
        ).to.eventually.be.rejectedWith("Invalid governance token id");
        await expect(
            this.ordersContract.createBuyOrder(
                true,
                RECORD_ID,
                COMMUNITY_TOKEN_ID + 2, //Invalid Community token id
                await web3.utils.toWei("100"),
                1,
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("5"),
                2
            )
        ).to.eventually.be.rejectedWith("Invalid community token id");
    });

    describe("With locked asset purchase order", function () {
        let snapShot2, snapshotId2;
        beforeEach(async function () {
            snapShot2 = await helper.takeSnapshot();
            snapshotId2 = snapShot2["result"];

            this.user1 = await helper.getEthAccount(0);
            this.user2 = await helper.getEthAccount(1);

            //Seller Approval
            await this.treasuryContract.setApprovalForAll(this.ordersContract.address, true);
            //Purchaser Approval
            await this.treasuryContract.setApprovalForAll(this.ordersContract.address, true, {
                from: this.user2,
            });

            //Transferring CRD token to user2
            await this.treasuryContract.safeTransferFrom(
                this.user1,
                this.user2,
                CRDTokenId,
                await web3.utils.toWei("100000"),
                "0x0"
            );

            let trx = await this.ordersContract.createBuyOrder(
                true,
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("100"),
                1,
                GOVERNANCE_TOKEN_ID,
                await web3.utils.toWei("5"),
                2,
                { from: this.user2 }
            );
            this.saleId = trx?.logs[0].args.saleId;
        });
        afterEach(async function () {
            await helper.revertToSnapshot(snapshotId2);
        });

        it("Should not be able to purchase locked asset if the ratio is wrong", async function () {
            // Here we are performing wrong ratio transfer it should be reject.
            await expect(
                this.ordersContract.acceptBuyOrder(
                    this.saleId, //SaleId
                    await web3.utils.toWei("1"), //governanceTokenAmount
                    await web3.utils.toWei("50"), //communityTokenAmount
                    { from: this.user1 }
                )
            ).to.eventually.be.rejectedWith("Invalid Ratio");

            await expect(
                this.ordersContract.acceptBuyOrder(
                    this.saleId, //SaleId
                    await web3.utils.toWei("1"), //governanceTokenAmount
                    await web3.utils.toWei("1"), //communityTokenAmount
                    { from: this.user1 }
                )
            ).to.eventually.be.rejectedWith("Invalid Ratio");
        });

        it("Trying to purchase more than available", async function () {
            // Here we are performing wrong ratio transfer it should be reject.
            await expect(
                this.ordersContract.acceptBuyOrder(
                    this.saleId, //SaleId
                    await web3.utils.toWei("100"), //governanceTokenAmount
                    await web3.utils.toWei("5"), //communityTokenAmount
                    { from: this.user1 }
                )
            ).to.eventually.be.rejectedWith("Governance token amount is insufficient");

            await expect(
                this.ordersContract.acceptBuyOrder(
                    this.saleId, //SaleId
                    await web3.utils.toWei("1"), //governanceTokenAmount
                    await web3.utils.toWei("500"), //communityTokenAmount
                    { from: this.user1 }
                )
            ).to.eventually.be.rejectedWith("Community token amount is insufficient");
        });

        it("Should able to purchase locked asset and sale should close", async function () {
            //-----------------------------------------------------------------------------//
            // Here we are performing partial transfer
            // That is we will only purchase some amount of the order
            trx = await this.ordersContract.acceptBuyOrder(
                this.saleId, //SaleId
                await web3.utils.toWei("4"), //governanceTokenAmount
                await web3.utils.toWei("80"), //communityTokenAmount
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
                await web3.utils.toWei("1"), //governanceTokenAmount
                await web3.utils.toWei("20"), //communityTokenAmount
                { from: this.user1 }
            );

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
    });
});

