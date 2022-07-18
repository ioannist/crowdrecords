const helper = require("../../utils/helper");
const BN = require("bn.js");
let SEED_CONTRIBUTION_ID = 1;
let NEW_CONTRIBUTION_1_ID = 2;
let RECORD_ID = 1;
let COMMUNITY_TOKEN_ID = 2;
let GOVERNANCE_TOKEN_ID = 3;
let GOVERNANCE_TOKEN_BALANCE_USER1 = new BN("450000000000000000000000");
let COMMUNITY_TOKEN_BALANCE_USER1 = new BN("450000000000000000000000");

async function createContribution() {
    this.contributionOwner = await helper.getEthAccount(9);
    this.rewardCommunityToken = await web3.utils.toWei("1000");
    this.rewardGovernanceToken = await web3.utils.toWei("1000");
    await this.contributionContract.createSeedContribution(
        [1, 2, 3],
        "preview.raw",
        "preview.hash",
        "This is the description for the record"
    );
    await this.recordsContract.createNewRecord("Test", "image.png", "Cat1", SEED_CONTRIBUTION_ID);
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
    await this.contributionContract.createNewContribution(
        [4, 5],
        "preview.raw",
        "preview.hash",
        RECORD_ID,
        false,
        "Test description",
        this.rewardCommunityToken,
        this.rewardGovernanceToken,
        {
            from: this.contributionOwner,
        }
    );
}

module.exports = {
    SEED_CONTRIBUTION_ID,
    NEW_CONTRIBUTION_1_ID,
    RECORD_ID,
    COMMUNITY_TOKEN_ID,
    GOVERNANCE_TOKEN_ID,
    createContribution,
};

