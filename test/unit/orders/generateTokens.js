const helper = require("../../utils/helper");
let SEED_CONTRIBUTION_ID = 1;
let NEW_CONTRIBUTION_1_ID = 2;
let RECORD_ID = 1;
let COMMUNITY_TOKEN_ID = 2;
let GOVERNANCE_TOKEN_ID = 3;
let GOVERNANCE_TOKEN_BALANCE_USER1 = 450000;
let COMMUNITY_TOKEN_BALANCE_USER1 = 450000;

async function generateTokens() {
    await this.contributionContract.createSeedContribution(
        [1, 2, 3],
        "preview.raw",
        "preview.hash",
        "This is the description for the record"
    );
    await this.recordsContract.createNewRecord("Test", "image.png", "Cat1", SEED_CONTRIBUTION_ID);
    await this.treasuryContract.createNewCommunityToken([
        1,
        1000000,
        COMMUNITY_TOKEN_BALANCE_USER1,
        "Test",
        "image.png",
    ]);
    await this.treasuryContract.createNewGovernanceToken([
        1,
        1000000,
        GOVERNANCE_TOKEN_BALANCE_USER1,
        "Test",
        "image.png",
    ]);
}

module.exports = {
    SEED_CONTRIBUTION_ID,
    NEW_CONTRIBUTION_1_ID,
    RECORD_ID,
    COMMUNITY_TOKEN_ID,
    GOVERNANCE_TOKEN_ID,
    GOVERNANCE_TOKEN_BALANCE_USER1,
    COMMUNITY_TOKEN_BALANCE_USER1,
    generateTokens,
};

