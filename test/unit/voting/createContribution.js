const helper = require("../../utils/helper");
let SEED_CONTRIBUTION_ID = 1;
let NEW_CONTRIBUTION_1_ID = 2;
let RECORD_ID = 1;
let COMMUNITY_TOKEN_ID = 2;
let GOVERNANCE_TOKEN_ID = 3;

async function createContribution() {
    /* SEED_CONTRIBUTION_ID =  */ await this.contributionContract.createSeedContribution(
        [1, 2, 3],
        "preview.raw",
        "preview.hash",
        "This is the description for the record"
    );

    /* RECORD_ID =  */ await this.recordsContract.createNewRecord(
        "Test",
        "image.png",
        "Cat1",
        SEED_CONTRIBUTION_ID
    );
    /* COMMUNITY_TOKEN_ID =  */ await this.treasuryContract.createNewCommunityToken([
        1,
        10000,
        3000,
        "Test",
        "image.png",
    ]);
    /* GOVERNANCE_TOKEN_ID =  */ await this.treasuryContract.createNewGovernanceToken([
        1,
        10000,
        3000,
        "Test",
        "image.png",
    ]);
    /* NEW_CONTRIBUTION_1_ID =  */ await this.contributionContract.createNewContribution(
        [4, 5],
        "preview.raw",
        "preview.hash",
        RECORD_ID,
        false,
        "Test description",
        1000,
        COMMUNITY_TOKEN_ID,
        1000,
        GOVERNANCE_TOKEN_ID,
        {
            from: await helper.getEthAccount(1),
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

