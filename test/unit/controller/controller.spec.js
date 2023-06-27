const setup = require("../../utils/deployContracts");
const helper = require("../../utils/helper");
const chai = require("chai");
const BN = require("bn.js");
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const chaiBN = require("chai-bn")(BN);
const chaiAsPromised = require("chai-as-promised");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const expect = chai.expect;
chai.use(chaiBN);
chai.use(chaiAsPromised);

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

    it("Should set up a new record with valid input parameters, check if tracks owner is correct", async function() {
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

        // Checking the data for the track that is created to confirm if the address of owner is correctly set
        const data = await this.tracksContract.tracksData(1);
        expect(data.owner).to.be.equals(await helper.getEthAccount(0));
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

        const balance = await web3.eth.getBalance(await helper.getEthAccount(8));
        const expectedBalance = BigInt(+before + +helper.PLATFORM_FEES).toString();

        expect(balance).to.be.bignumber.equal(expectedBalance);

        await expect(event.args.caller).to.equal(await helper.getEthAccount(0));
        await expect(event.args.tracksId.length).to.equal(this.tracksPayload.length);
        await expect(event.args.seedId).to.be.a.bignumber.that.is.not.zero;
        await expect(event.args.recordId).to.be.a.bignumber.that.is.not.zero;
        await expect(event.args.govTokenId).to.be.a.bignumber.that.is.not.zero;
        await expect(event.args.commTokenId).to.be.a.bignumber.that.is.not.zero;
    });

    it("Should set up a new record with 110 tracks, shows gas used", async function() {
        const before = await web3.eth.getBalance(await helper.getEthAccount(8));
        // 110 is safe value
        const trackData = Array(110).fill({
            filehash: "QmXKQTJp7ATCzy4op4V4Q2YvZ8hDQ2x6x3xA6X9P6jyL6U",
            filelink: "https://ipfs.io/ipfs/QmXKQTJp7ATCzy4op4V4Q2YvZ8hDQ2x6x3xA6X9P6jyL6U",
            category: "Rock",
        });

        // Call the setupNewRecord function
        const tx = await this.controllerContract.setupNewRecord(
            trackData,
            this.seedContributionPayload,
            this.newRecordPayload,
            this.govTokenData,
            this.commTokenData,
            await helper.getEthAccount(8),
            helper.PLATFORM_FEES,
            { value: helper.PLATFORM_FEES, from: await helper.getEthAccount(0) }
        );

        // Extract the emitted event from the transaction receipt
        const event = expectEvent(tx, "setupNewRecordCalled");

        const gasCost = await helper.calculateGasCost(tx);
        console.log("🚀 ~ file: controller.spec.js:145 ~ it ~ gasCost:", gasCost);
    });

    it("Create a record, try to create community token with 0 tokens, expect revert", async function() {
        const commTokenData2 = {
            recordId: 0, // This will be filled later after the record is created
            totalSupply: web3.utils.toWei("0"),
            userBalance: web3.utils.toWei("0"),
            symbol: "COMM2",
            image: "someImageLink",
        };

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
        ).to.eventually.rejectedWith("INVALID: COMM_AT_LEAST_1_TOKEN");
    });

    it("Create a record, try to create governance token with 0 tokens, expect revert", async function() {
        const govTokenData2 = {
            recordId: 0, // This will be filled later after the record is created
            totalSupply: web3.utils.toWei("0"),
            userBalance: web3.utils.toWei("0"),
            symbol: "GOV2",
            image: "someImageLink",
        };

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
        ).to.eventually.rejectedWith("INVALID: GOV_AT_LEAST_1_TOKEN");
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

    it("Try to create record with MAX_INT Community Token, should revert", async function() {
        const maxIntAmount = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
        const commTokenData2 = {
            recordId: 0, // This will be filled later after the record is created
            totalSupply: maxIntAmount,
            userBalance: web3.utils.toWei("20000"),
            symbol: "COMM2",
            image: "someImageLink",
        };

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
        ).to.eventually.be.rejectedWith("INVALID: COM_SUPPLY_LIMIT_REACHED");
    });

    it("Try to create record with MAX_INT Governance Token, should revert", async function() {
        const maxIntAmount = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
        const govTokenData2 = {
            recordId: 0, // This will be filled later after the record is created
            totalSupply: maxIntAmount,
            userBalance: web3.utils.toWei("10000"),
            symbol: "GOV2",
            image: "someImageLink",
        };

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
        ).to.eventually.be.rejectedWith("INVALID: GOV_SUPPLY_LIMIT_REACHED");
    });

    it("Try to create record with more than 1 Billion Community Token, should revert", async function() {
        const commTokenData2 = {
            recordId: 0, // This will be filled later after the record is created
            totalSupply: web3.utils.toWei("1000000001"),
            userBalance: web3.utils.toWei("20000"),
            symbol: "COMM2",
            image: "someImageLink",
        };

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
        ).to.eventually.be.rejectedWith("INVALID: COM_SUPPLY_LIMIT_REACHED");
    });

    it("Try to create record with more than 1 Billion Governance Token, should revert", async function() {
        const govTokenData2 = {
            recordId: 0, // This will be filled later after the record is created
            totalSupply: web3.utils.toWei("1000000001"),
            userBalance: web3.utils.toWei("10000"),
            symbol: "GOV2",
            image: "someImageLink",
        };

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
        ).to.eventually.be.rejectedWith("INVALID: GOV_SUPPLY_LIMIT_REACHED");
    });

    it("Create record with exact 1 Billion Community Token", async function() {
        const commTokenData2 = {
            recordId: 0, // This will be filled later after the record is created
            totalSupply: web3.utils.toWei("1000000000"),
            userBalance: web3.utils.toWei("20000"),
            symbol: "COMM2",
            image: "someImageLink",
        };

        await this.controllerContract.setupNewRecord(
            this.tracksPayload,
            this.seedContributionPayload,
            this.newRecordPayload,
            this.govTokenData,
            commTokenData2,
            await helper.getEthAccount(8),
            helper.PLATFORM_FEES,
            { value: helper.PLATFORM_FEES }
        );
    });

    it("Create record with exact 1 Billion Governance Token", async function() {
        const govTokenData2 = {
            recordId: 0, // This will be filled later after the record is created
            totalSupply: web3.utils.toWei("1000000000"),
            userBalance: web3.utils.toWei("10000"),
            symbol: "GOV2",
            image: "someImageLink",
        };

        await this.controllerContract.setupNewRecord(
            this.tracksPayload,
            this.seedContributionPayload,
            this.newRecordPayload,
            govTokenData2,
            this.commTokenData,
            await helper.getEthAccount(8),
            helper.PLATFORM_FEES,
            { value: helper.PLATFORM_FEES }
        );
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
            const balance = await web3.eth.getBalance(await helper.getEthAccount(8));
            const expectedBalance = BigInt(+before + +helper.PLATFORM_FEES).toString();

            expect(balance).to.be.bignumber.equal(expectedBalance);
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

