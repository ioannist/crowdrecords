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

    it("Calling createNewGovernanceToken function and getting rejected", async function() {
        await expect(
            this.treasuryCoreContract.createNewGovernanceToken(
                [
                    1,
                    await web3.utils.toWei("1000000"),
                    await web3.utils.toWei("100000"),
                    "SYMOL",
                    "IMAGE_LINK",
                ],
                await helper.getEthAccount(0)
            )
        ).to.eventually.be.rejectedWith("UNAUTHORIZED: CANNOT_PERFORM_ACTION");
    });

    it("Calling createNewCommunityToken function and getting rejected", async function() {
        await expect(
            this.treasuryCoreContract.createNewCommunityToken(
                [
                    1,
                    await web3.utils.toWei("1000000"),
                    await web3.utils.toWei("100000"),
                    "SYMOL",
                    "IMAGE_LINK",
                ],
                await helper.getEthAccount(0)
            )
        ).to.eventually.be.rejectedWith("UNAUTHORIZED: CANNOT_PERFORM_ACTION");
    });

    it("Calling mintTokens function and getting rejected", async function() {
        await expect(
            this.treasuryCoreContract.mintTokens(1, 2, await web3.utils.toWei("100000"))
        ).to.eventually.be.rejectedWith("UNAUTHORIZED: CANNOT_PERFORM_ACTION");
    });

    it("Calling snapshot function and getting rejected", async function() {
        await expect(this.treasuryCoreContract.snapshot()).to.eventually.be.rejectedWith(
            "UNAUTHORIZED: CANNOT_PERFORM_ACTION"
        );
    });
});

