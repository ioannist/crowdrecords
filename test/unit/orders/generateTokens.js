const helper = require("../../utils/helper");
const BN = require("bn.js");
let SEED_CONTRIBUTION_ID = 1;
let NEW_CONTRIBUTION_1_ID = 2;
let RECORD_ID = 1;
let COMMUNITY_TOKEN_ID = 2;
let GOVERNANCE_TOKEN_ID = 3;
let GOVERNANCE_TOKEN_BALANCE_USER1 = new BN("450000000000000000000000");
let COMMUNITY_TOKEN_BALANCE_USER1 = new BN("450000000000000000000000");

async function generateTokens() {
    await this.tracksContract.createNewTracks([["fileHash1", "fileLink1", "Category1"]]);
    await this.tracksContract.createNewTracks([["fileHash2", "fileLink2", "Category2"]]);
    await this.tracksContract.createNewTracks([["fileHash3", "fileLink3", "Category3"]]);

    await this.contributionContract.createSeedContribution(
        [
            [1, 2, 3],
            "contribution title",
            "preview.raw",
            "preview.hash",
            "This is the description for the record",
        ],
        await helper.getEthAccount(8),
        0
    );
    await this.recordsContract.createNewRecord(
        ["Test", "image.png", "Cat1", SEED_CONTRIBUTION_ID],
        await helper.getEthAccount(8),
        0,
        {
            value: 0,
        }
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

