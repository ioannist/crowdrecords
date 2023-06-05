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
contract("Treasury Contract", function() {
    async function createTrack(tracksContract, owner) {
        const tx = await tracksContract.createNewTracks([["fileHash", "fileLink", "Category"]], {
            from: owner,
        });
        await expectEvent(tx, "TrackCreated", {
            filehash: "fileHash",
            category: "Category",
        });
    }

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

    it("Try to create community token with invalid recordId.", async function() {
        // Creating token with incorrect record id
        await expect(
            this.treasuryContract.createNewCommunityToken([
                3,
                await web3.utils.toWei("1000000"),
                COMMUNITY_TOKEN_BALANCE_USER1,
                "Test",
                "TEST",
            ])
        ).to.eventually.rejectedWith("INVALID: ONLY_RECORD_OWNER");
    });

    it("Try to create governance token with invalid recordId.", async function() {
        await expect(
            this.treasuryContract.createNewGovernanceToken([
                3,
                await web3.utils.toWei("1000000"),
                COMMUNITY_TOKEN_BALANCE_USER1,
                "Test",
                "TEST",
            ])
        ).to.eventually.rejectedWith("INVALID: ONLY_RECORD_OWNER");
    });

    it("Create a record, other user tries to create community token.", async function() {
        const nonOwner = await helper.getEthAccount(3);

        const user1 = await helper.getEthAccount(0);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);

        // Create new contribution token, it's id will be 2
        await this.contributionContract.createSeedContribution(
            [
                [1, 2, 3],
                "contribution title",
                "preview.raw",
                "preview.hash",
                "This is the description for the record",
            ],
            await helper.getEthAccount(8),
            0,
            { from: user1 }
        );

        // Create new record with new contribution
        await this.recordsContract.createNewRecord(
            ["Test", "image.png", "Cat1", 2],
            await helper.getEthAccount(8),
            "0",
            {
                value: 0,
            }
        );

        // Non owner user tries to create the community token and expect revert
        await expect(
            this.treasuryContract.createNewCommunityToken(
                [
                    2,
                    await web3.utils.toWei("1000000"),
                    COMMUNITY_TOKEN_BALANCE_USER1,
                    "Test",
                    "TEST",
                ],
                { from: nonOwner }
            )
        ).to.eventually.rejectedWith("INVALID: ONLY_RECORD_OWNER");
    });

    it("Create a record, other user tries to create governance token.", async function() {
        const nonOwner = await helper.getEthAccount(3);

        const user1 = await helper.getEthAccount(0);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);

        // Create new contribution token, it's id will be 2
        await this.contributionContract.createSeedContribution(
            [
                [1, 2, 3],
                "contribution title",
                "preview.raw",
                "preview.hash",
                "This is the description for the record",
            ],
            await helper.getEthAccount(8),
            0,
            { from: user1 }
        );

        // Create new record with new contribution
        await this.recordsContract.createNewRecord(
            ["Test", "image.png", "Cat1", 2],
            await helper.getEthAccount(8),
            "0",
            {
                value: 0,
            }
        );

        // Non owner user tries to create the governance token and expect revert
        await expect(
            this.treasuryContract.createNewGovernanceToken(
                [
                    2,
                    await web3.utils.toWei("1000000"),
                    COMMUNITY_TOKEN_BALANCE_USER1,
                    "Test",
                    "TEST",
                ],
                { from: nonOwner }
            )
        ).to.eventually.rejectedWith("INVALID: ONLY_RECORD_OWNER");
    });

    it("Create a record, create community token twice, reject.", async function() {
        const user1 = await helper.getEthAccount(0);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);

        // Create new contribution token, it's id will be 2
        await this.contributionContract.createSeedContribution(
            [
                [1, 2, 3],
                "contribution title",
                "preview.raw",
                "preview.hash",
                "This is the description for the record",
            ],
            await helper.getEthAccount(8),
            0,
            { from: user1 }
        );

        // Create new record with new contribution
        await this.recordsContract.createNewRecord(
            ["Test", "image.png", "Cat1", 2],
            await helper.getEthAccount(8),
            "0",
            {
                value: 0,
            }
        );

        await this.treasuryContract.createNewCommunityToken([
            2,
            await web3.utils.toWei("1000000"),
            COMMUNITY_TOKEN_BALANCE_USER1,
            "Test 1",
            "TEST 1",
        ]);
        await expect(
            this.treasuryContract.createNewCommunityToken([
                2,
                await web3.utils.toWei("1000000"),
                COMMUNITY_TOKEN_BALANCE_USER1,
                "Test 2",
                "TEST 2",
            ])
        ).to.eventually.rejectedWith("INVALID: TOKEN_ALREADY_CREATED");
    });

    it("Create a record, create governance token twice, reject.", async function() {
        const user1 = await helper.getEthAccount(0);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);

        // Create new contribution token, it's id will be 2
        await this.contributionContract.createSeedContribution(
            [
                [1, 2, 3],
                "contribution title",
                "preview.raw",
                "preview.hash",
                "This is the description for the record",
            ],
            await helper.getEthAccount(8),
            0,
            { from: user1 }
        );

        // Create new record with new contribution
        await this.recordsContract.createNewRecord(
            ["Test", "image.png", "Cat1", 2],
            await helper.getEthAccount(8),
            "0",
            {
                value: 0,
            }
        );

        await this.treasuryContract.createNewGovernanceToken([
            2,
            await web3.utils.toWei("1000000"),
            COMMUNITY_TOKEN_BALANCE_USER1,
            "Test 1",
            "TEST 1",
        ]);
        await expect(
            this.treasuryContract.createNewGovernanceToken([
                2,
                await web3.utils.toWei("1000000"),
                COMMUNITY_TOKEN_BALANCE_USER1,
                "Test 2",
                "TEST 2",
            ])
        ).to.eventually.rejectedWith("INVALID: TOKEN_ALREADY_CREATED");
    });

    it("Calling createNewGovernanceTokenNewRecordVersion function outside of records contract and getting rejected", async function() {
        await expect(
            this.treasuryContract.createNewGovernanceTokenNewRecordVersion(
                1,
                await web3.utils.toWei("1000000"),
                await web3.utils.toWei("100000"),
                "SYMOL",
                "IMAGE_LINK",
                await web3.utils.toWei("20000"),
                await helper.getEthAccount(0)
            )
        ).to.eventually.be.rejectedWith("UNAUTHORIZED: ONLY_RECORDS_CONTRACT");
    });

    it("Calling createNewCommunityTokenNewRecordVersion function outside of records contract and getting rejected", async function() {
        await expect(
            this.treasuryContract.createNewCommunityTokenNewRecordVersion(
                1,
                await web3.utils.toWei("1000000"),
                await web3.utils.toWei("100000"),
                "SYMOL",
                "IMAGE_LINK",
                await web3.utils.toWei("20000"),
                await helper.getEthAccount(0)
            )
        ).to.eventually.be.rejectedWith("UNAUTHORIZED: ONLY_RECORDS_CONTRACT");
    });

    it("Create a record, try to create governance token with more than 1 billion token supply, reject.", async function() {
        const user1 = await helper.getEthAccount(0);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);

        // Create new contribution token, it's id will be 2
        await this.contributionContract.createSeedContribution(
            [
                [1, 2, 3],
                "contribution title",
                "preview.raw",
                "preview.hash",
                "This is the description for the record",
            ],
            await helper.getEthAccount(8),
            0,
            { from: user1 }
        );

        // Create new record with new contribution
        await this.recordsContract.createNewRecord(
            ["Test", "image.png", "Cat1", 2],
            await helper.getEthAccount(8),
            "0",
            {
                value: 0,
            }
        );

        await expect(
            this.treasuryContract.createNewGovernanceToken([
                2,
                await web3.utils.toWei("1000000001"),
                COMMUNITY_TOKEN_BALANCE_USER1,
                "Test 2",
                "TEST 2",
            ])
        ).to.eventually.rejectedWith("INVALID: SUPPLY_LIMIT_REACHED");
    });

    it("Create a record, create community token with more than 1 Billion token supply, reject.", async function() {
        const user1 = await helper.getEthAccount(0);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);

        // Create new contribution token, it's id will be 2
        await this.contributionContract.createSeedContribution(
            [
                [1, 2, 3],
                "contribution title",
                "preview.raw",
                "preview.hash",
                "This is the description for the record",
            ],
            await helper.getEthAccount(8),
            0,
            { from: user1 }
        );

        // Create new record with new contribution
        await this.recordsContract.createNewRecord(
            ["Test", "image.png", "Cat1", 2],
            await helper.getEthAccount(8),
            "0",
            {
                value: 0,
            }
        );

        await expect(
            this.treasuryContract.createNewCommunityToken([
                2,
                await web3.utils.toWei("1000000001"),
                COMMUNITY_TOKEN_BALANCE_USER1,
                "Test 2",
                "TEST 2",
            ])
        ).to.eventually.rejectedWith("INVALID: SUPPLY_LIMIT_REACHED");
    });

    it("Create a record, create governance token with exact than 1 billion token supply", async function() {
        const user1 = await helper.getEthAccount(0);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);

        // Create new contribution token, it's id will be 2
        await this.contributionContract.createSeedContribution(
            [
                [1, 2, 3],
                "contribution title",
                "preview.raw",
                "preview.hash",
                "This is the description for the record",
            ],
            await helper.getEthAccount(8),
            0,
            { from: user1 }
        );

        // Create new record with new contribution
        await this.recordsContract.createNewRecord(
            ["Test", "image.png", "Cat1", 2],
            await helper.getEthAccount(8),
            "0",
            {
                value: 0,
            }
        );

        await this.treasuryContract.createNewGovernanceToken([
            2,
            await web3.utils.toWei("1000000000"),
            COMMUNITY_TOKEN_BALANCE_USER1,
            "Test 2",
            "TEST 2",
        ]);
    });

    it("Create a record, create community token with exact than 1 Billion token supply", async function() {
        const user1 = await helper.getEthAccount(0);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);
        await createTrack(this.tracksContract, user1);

        // Create new contribution token, it's id will be 2
        await this.contributionContract.createSeedContribution(
            [
                [1, 2, 3],
                "contribution title",
                "preview.raw",
                "preview.hash",
                "This is the description for the record",
            ],
            await helper.getEthAccount(8),
            0,
            { from: user1 }
        );

        // Create new record with new contribution
        await this.recordsContract.createNewRecord(
            ["Test", "image.png", "Cat1", 2],
            await helper.getEthAccount(8),
            "0",
            {
                value: 0,
            }
        );

        await this.treasuryContract.createNewCommunityToken([
            2,
            await web3.utils.toWei("1000000000"),
            COMMUNITY_TOKEN_BALANCE_USER1,
            "Test 2",
            "TEST 2",
        ]);
    });

    it("Calling from outside of the contribution contract mintTokens with 3 params function and getting rejected", async function() {
        await expect(
            this.treasuryContract.mintTokens(1, 2, await web3.utils.toWei("100000"))
        ).to.eventually.be.rejectedWith("UNAUTHORIZED: CANNOT_PERFORM_ACTION");
    });

    it("Calling from outside of the dilution contract mintTokens with 3 params function and getting rejected", async function() {
        await expect(this.treasuryContract.mintTokens(1, 2)).to.eventually.be.rejectedWith(
            "UNAUTHORIZED: CANNOT_PERFORM_ACTION"
        );
    });

    it("Calling transferRewardAmount function from outside of contribution voting contract and getting rejected", async function() {
        await expect(
            this.treasuryContract.transferRewardAmount(
                await helper.getEthAccount(0),
                1,
                2,
                await web3.utils.toWei("10000"),
                await web3.utils.toWei("10000")
            )
        ).to.eventually.be.rejectedWith("UNAUTHORIZED: CANNOT_PERFORM_ACTION");
    });

    it("Calling getCommunityTokenId function and get token Id", async function() {
        // The community token id for record with ID 1 is 2
        await expect(
            this.treasuryContract.getCommunityTokenId(1)
        ).to.eventually.be.bignumber.equals("2");
    });

    it("Calling getCommunityTokenId with invalid id function and getting rejected", async function() {
        // Trying to get community token id of invalid record
        await expect(this.treasuryContract.getCommunityTokenId(10)).to.eventually.be.rejectedWith(
            "INVALID: WRONG_RECORD_ID"
        );
    });

    it("Calling getGovernanceTokenId function and get token Id", async function() {
        // The governance token id for record with ID 1 is 3
        await expect(
            this.treasuryContract.getGovernanceTokenId(1)
        ).to.eventually.be.bignumber.equals("3");
    });

    it("Calling getGovernanceTokenId with invalid id function and getting rejected", async function() {
        // Trying to get governance token id of invalid record
        await expect(this.treasuryContract.getGovernanceTokenId(10)).to.eventually.be.rejectedWith(
            "INVALID: WRONG_RECORD_ID"
        );
    });

    it("Calling setSymbolsAsUsed function from outside of the records voting contract and getting rejected", async function() {
        await expect(
            this.treasuryContract.setSymbolsAsUsed("SYM_GOV", "SYM_COMM")
        ).to.eventually.be.rejectedWith("UNAUTHORIZED: ONLY_RECORDS_CONTRACT");
    });

    it("Calling setSymbolsAsAvailable function from outside of the records voting contract and getting rejected", async function() {
        await expect(
            this.treasuryContract.setSymbolsAsAvailable("SYM_GOV", "SYM_COMM")
        ).to.eventually.be.rejectedWith("UNAUTHORIZED: ONLY_RECORDS_CONTRACT");
    });

    it("Calling snapshot function from outside of the permitted address and getting rejected", async function() {
        await expect(this.treasuryContract.snapshot()).to.eventually.be.rejectedWith(
            "UNAUTHORIZED: ONLY_SNAPSHOT_CALLERS"
        );
    });

    //TODO Define upper bound and lower bound limit for token creation in both community and governance. And tests for this.
});

