const setup = require("../../utils/deployContracts");
const helper = require("../../utils/helper");
const chai = require("chai");
const BN = require("bn.js");
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const chaiBN = require("chai-bn")(BN);
const chaiAsPromised = require("chai-as-promised");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const { expectRevert } = require("@openzeppelin/test-helpers");
chai.use(chaiAsPromised);
const expect = chai.expect;

contract("ControllerContract - setupNewRecord", function() {
    before(setup);

    let snapShot, snapshotId;
    beforeEach(async function() {
        this.tracksPayload = [
            {
                filehash: "QmXKQTJp7ATCzy4op4V4Q2YvZ8hDQ2x6x3xA6X9P6jyL6U",
                filelink: "https://ipfs.io/ipfs/QmXKQTJp7ATCzy4op4V4Q2YvZ8hDQ2x6x3xA6X9P6jyL6U",
                category: "Rock",
            },
        ];

        this.seedContributionPayload = {
            tracks: [], // This will be filled later after tracks are created
            title: "My New Album",
            previewFile: "https://ipfs.io/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
            previewFileHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
            description: "This is my new album description",
        };

        this.newRecordPayload = {
            name: "My Record",
            image: "someImageLink",
            recordCategory: "Rock",
            seedId: 0, // This will be filled later after seed contribution is created
        };

        this.govTokenData = {
            recordId: 0, // This will be filled later after the record is created
            totalSupply: web3.utils.toWei("1000000"),
            userBalance: web3.utils.toWei("10000"),
            symbol: "GOV",
            image: "someImageLink",
        };

        this.commTokenData = {
            recordId: 0, // This will be filled later after the record is created
            totalSupply: web3.utils.toWei("2000000"),
            userBalance: web3.utils.toWei("20000"),
            symbol: "COMM",
            image: "someImageLink",
        };

        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot["result"];
    });
    afterEach(async function() {
        await helper.revertToSnapshot(snapshotId);
    });

    it("Should set up a new record with valid input parameters, no platform fees", async function() {
        // Call the setupNewRecord function
        const tx = await this.controllerContract.setupNewRecord(
            this.tracksPayload,
            this.seedContributionPayload,
            this.newRecordPayload,
            this.govTokenData,
            this.commTokenData,
            await helper.getEthAccount(8),
            0,
            { value: 0 }
        );

        // Extract the emitted event from the transaction receipt
        const event = expectEvent(tx, "setupNewRecordCalled");

        await expect(event.args.caller).to.equal(await helper.getEthAccount(0));
        await expect(event.args.tracksId.length).to.equal(this.tracksPayload.length);
        await expect(event.args.seedId).to.be.a.bignumber.that.is.not.zero;
        await expect(event.args.recordId).to.be.a.bignumber.that.is.not.zero;
        await expect(event.args.govTokenId).to.be.a.bignumber.that.is.not.zero;
        await expect(event.args.commTokenId).to.be.a.bignumber.that.is.not.zero;
    });

    it("Should set up a new record with valid input parameters, check if platform fees are charged", async function() {
        const before = await web3.eth.getBalance(await helper.getEthAccount(8));

        // Call the setupNewRecord function
        const tx = await this.controllerContract.setupNewRecord(
            this.tracksPayload,
            this.seedContributionPayload,
            this.newRecordPayload,
            this.govTokenData,
            this.commTokenData,
            await helper.getEthAccount(8),
            helper.PLATFORM_FEES,
            { value: helper.PLATFORM_FEES }
        );

        // Extract the emitted event from the transaction receipt
        const event = expectEvent(tx, "setupNewRecordCalled");

        await expect(
            web3.eth.getBalance(await helper.getEthAccount(8))
        ).to.eventually.be.bignumber.equal(BigInt(+before + +helper.PLATFORM_FEES).toString());

        await expect(event.args.caller).to.equal(await helper.getEthAccount(0));
        await expect(event.args.tracksId.length).to.equal(this.tracksPayload.length);
        await expect(event.args.seedId).to.be.a.bignumber.that.is.not.zero;
        await expect(event.args.recordId).to.be.a.bignumber.that.is.not.zero;
        await expect(event.args.govTokenId).to.be.a.bignumber.that.is.not.zero;
        await expect(event.args.commTokenId).to.be.a.bignumber.that.is.not.zero;
    });

    it("Try to create 2 records with same Governance Token Name, should revert", async function() {
        const commTokenData2 = {
            recordId: 0, // This will be filled later after the record is created
            totalSupply: web3.utils.toWei("2000000"),
            userBalance: web3.utils.toWei("20000"),
            symbol: "COMM2",
            image: "someImageLink",
        };

        let checkIfSymbolInuse = await this.treasuryCoreContract.commTokenSym.call(
            this.commTokenData.symbol
        );

        // Call the setupNewRecord function
        const tx = await this.controllerContract.setupNewRecord(
            this.tracksPayload,
            this.seedContributionPayload,
            this.newRecordPayload,
            this.govTokenData,
            this.commTokenData,
            await helper.getEthAccount(8),
            helper.PLATFORM_FEES,
            { value: helper.PLATFORM_FEES }
        );

        await expect(
            this.controllerContract.setupNewRecord(
                this.tracksPayload,
                this.seedContributionPayload,
                this.newRecordPayload,
                this.govTokenData,
                commTokenData2,
                await helper.getEthAccount(8),
                helper.PLATFORM_FEES,
                { value: helper.PLATFORM_FEES }
            )
        ).to.eventually.be.rejectedWith("INVALID: GOV_TOKEN_SYMBOL_ALREADY_IN_USE");
    });

    it("Try to create 2 records with same Community Token Name, should revert", async function() {
        const govTokenData2 = {
            recordId: 0, // This will be filled later after the record is created
            totalSupply: web3.utils.toWei("1000000"),
            userBalance: web3.utils.toWei("10000"),
            symbol: "GOV2",
            image: "someImageLink",
        };

        // Call the setupNewRecord function
        const tx = await this.controllerContract.setupNewRecord(
            this.tracksPayload,
            this.seedContributionPayload,
            this.newRecordPayload,
            this.govTokenData,
            this.commTokenData,
            await helper.getEthAccount(8),
            helper.PLATFORM_FEES,
            { value: helper.PLATFORM_FEES }
        );

        await expect(
            this.controllerContract.setupNewRecord(
                this.tracksPayload,
                this.seedContributionPayload,
                this.newRecordPayload,
                govTokenData2,
                this.commTokenData,
                await helper.getEthAccount(8),
                helper.PLATFORM_FEES,
                { value: helper.PLATFORM_FEES }
            )
        ).to.eventually.be.rejectedWith("INVALID: COMM_TOKEN_SYMBOL_ALREADY_IN_USE");
    });

    it("Should revert for insufficient platform fee", async function() {
        const insufficientPlatformFee = new BN("0");

        await expect(
            this.controllerContract.setupNewRecord(
                this.tracksPayload,
                this.seedContributionPayload,
                this.newRecordPayload,
                this.govTokenData,
                this.commTokenData,
                await helper.getEthAccount(8),
                helper.PLATFORM_FEES,
                { value: insufficientPlatformFee }
            )
        ).to.eventually.be.rejectedWith("INV: INSUFFICIENT_PLATFORM_FEE");
    });

    context("Testing for new contribution", function() {
        let snapShot1, snapshotId1;
        beforeEach(async function() {
            snapShot1 = await helper.takeSnapshot();
            snapshotId1 = snapShot1["result"];

            // Call the setupNewRecord function
            const tx = await this.controllerContract.setupNewRecord(
                this.tracksPayload,
                this.seedContributionPayload,
                this.newRecordPayload,
                this.govTokenData,
                this.commTokenData,
                await helper.getEthAccount(8),
                0,
                { value: 0 }
            );

            expectEvent(tx, "setupNewRecordCalled");

            this.tracksPayloadForContribution = [
                {
                    filehash: "Qmexample1",
                    filelink: "https://example.com/file1",
                    category: "category1",
                },
                {
                    filehash: "Qmexample2",
                    filelink: "https://example.com/file2",
                    category: "category2",
                },
            ];

            this.payloadForContribution = {
                tracks: [], // Will be filled in the createNewContribution function
                title: "Test Title",
                previewFile: "https://example.com/preview",
                previewFileHash: "QmexamplePreview",
                recordId: 1,
                roughMix: true,
                description: "Test Description",
                communityReward: 500,
                governanceReward: 200,
            };
            this.newRecordId = 1;
        });
        afterEach(async function() {
            await helper.revertToSnapshot(snapshotId1);
        });

        it("Should create new contribution, no platform fees", async function() {
            // Call the createNewContribution function
            const tx = await this.controllerContract.createNewContribution(
                this.tracksPayloadForContribution,
                this.payloadForContribution,
                await helper.getEthAccount(8),
                0,
                { value: helper.VOTING_DEPOSIT_CONTRIBUTION_CONTRACT }
            );

            // Extract the emitted event from the transaction receipt
            expectEvent(tx, "createNewContributionCalled");
        });

        it("Should create new contribution, with platform fees", async function() {
            const before = await web3.eth.getBalance(await helper.getEthAccount(8));

            // Call the createNewContribution function
            const tx = await this.controllerContract.createNewContribution(
                this.tracksPayloadForContribution,
                this.payloadForContribution,
                await helper.getEthAccount(8),
                helper.PLATFORM_FEES,
                { value: +helper.PLATFORM_FEES + +helper.VOTING_DEPOSIT_CONTRIBUTION_CONTRACT }
            );

            // Extract the emitted event from the transaction receipt
            expectEvent(tx, "createNewContributionCalled");

            await expect(
                web3.eth.getBalance(await helper.getEthAccount(8))
            ).to.eventually.be.bignumber.equal(BigInt(+before + +helper.PLATFORM_FEES).toString());
        });
        it("Try to create new contribution with less platform fees, should fail", async function() {
            await expect(
                this.controllerContract.createNewContribution(
                    this.tracksPayloadForContribution,
                    this.payloadForContribution,
                    await helper.getEthAccount(8),
                    helper.PLATFORM_FEES,
                    {
                        value:
                            +helper.PLATFORM_FEES -
                            +helper.PLATFORM_FEES +
                            +helper.VOTING_DEPOSIT_CONTRIBUTION_CONTRACT,
                    }
                )
            ).to.eventually.be.rejectedWith("INV: INSUFFICIENT_PLATFORM_FEE");
        });
    });
});

