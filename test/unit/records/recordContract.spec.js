const setup = require("../../utils/deployContracts");
const helper = require("../../utils/helper");
const chai = require("chai");
const BN = require("bn.js");
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const { expectRevert } = require("@openzeppelin/test-helpers");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

contract("Records Contract", function () {
    let SEED_CONTRIBUTION_ID = 1;
    let NEW_CONTRIBUTION_1_ID = 2;
    let RECORD_ID = 1;
    let COMMUNITY_TOKEN_ID = 2;
    let GOVERNANCE_TOKEN_ID = 3;
    let GOVERNANCE_TOKEN_BALANCE_USER1;
    let COMMUNITY_TOKEN_BALANCE_USER1;

    let contributionOwner;
    let rewardCommunityToken;
    let rewardGovernanceToken;

    before(setup);
    before(async () => {
        GOVERNANCE_TOKEN_BALANCE_USER1 = await web3.utils.toWei("450000");
        COMMUNITY_TOKEN_BALANCE_USER1 = await web3.utils.toWei("450000");

        contributionOwner = await helper.getEthAccount(9);
        rewardCommunityToken = await web3.utils.toWei("1000");
        rewardGovernanceToken = await web3.utils.toWei("1000");
    });

    let snapShot, snapshotId;
    beforeEach(async function () {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot["result"];
    });
    afterEach(async function () {
        await helper.revertToSnapshot(snapshotId);
    });

    //creating new record from existing records

    it("Creating seed contribution and record", async function () {
        //seed contribution id 1
        await this.contributionContract.createSeedContribution(
            [1, 2, 3],
            "preview.raw",
            "preview.hash",
            "This is the description for the record 1"
        );
        const tx = await this.recordsContract.createNewRecord(
            "Test",
            "image.png",
            "Cat1",
            SEED_CONTRIBUTION_ID
        );
        expectEvent(tx, "RecordCreated", {
            seedId: "1",
        });
    });

    // it("Creating record with invalid seed contribution Id, expect revert", async function () {
    //     // The following transaction should reject with error message but instead it just gets 'exited with an error (status 0) after consuming all gas.'
    //     // this is happening when trying to get data of a contribution that is not yet created
    //     await expect(
    //         this.recordsContract.createNewRecord("Test", "image.png", "Cat1", 3)
    //     ).to.eventually.rejectedWith("No contribution with this id is found");
    // });

    it("Creating a normal contribution and try to create record with it, expect reject", async function () {
        //seed contribution id 1
        await this.contributionContract.createSeedContribution(
            [1, 2, 3],
            "preview.raw",
            "preview.hash",
            "This is the description for the record 1"
        );
        await this.recordsContract.createNewRecord(
            "Test",
            "image.png",
            "Cat1",
            SEED_CONTRIBUTION_ID
        );
        await this.treasuryContract.createNewCommunityToken([
            RECORD_ID,
            await web3.utils.toWei("1000000"),
            COMMUNITY_TOKEN_BALANCE_USER1,
            "Test",
            "image.png",
        ]);
        await this.treasuryContract.createNewGovernanceToken([
            RECORD_ID,
            await web3.utils.toWei("1000000"),
            GOVERNANCE_TOKEN_BALANCE_USER1,
            "Test",
            "image.png",
        ]);

        //this contribution will have id of 2
        await this.contributionContract.createNewContribution(
            [4, 5],
            "preview.raw",
            "preview.hash",
            RECORD_ID,
            false,
            "Test description",
            rewardCommunityToken,
            rewardGovernanceToken,
            {
                from: contributionOwner,
            }
        );

        await expect(
            this.recordsContract.createNewRecord("Test", "image.png", "Cat1", 2)
        ).to.eventually.rejectedWith("Contribution needs to be seed contribution");
    });
});

