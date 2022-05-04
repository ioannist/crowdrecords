const timeMachine = require("../../utils/helper");
const setup = require("../../utils/deployContracts");

contract("Deployment", function () {
    before(setup);
    let snapShot, snapshotId;
    beforeEach(async function () {
        snapShot = await timeMachine.takeSnapshot();
        snapshotId = snapShot["result"];
    });
    afterEach(async function () {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    it("Should deploy all contracts", async function () {
        assert(this.tracksContract.address !== "");
        assert(this.contributionContract.address !== "");
        assert(this.recordsContract.address !== "");
        assert(this.treasuryContract.address !== "");
        assert(this.contributionVotingContract.address !== "");
        assert(this.ordersContract.address !== "");
    });

    it("All address set", async function () {
        assert(
            (await this.contributionContract.CONTRIBUTION_VOTING_CONTRACT_ADDRESS()) ===
                this.contributionVotingContract.address
        );
        assert(
            (await this.treasuryContract.RECORDS_CONTRACT_ADDRESS()) ===
                this.recordsContract.address
        );
        assert(
            (await this.contributionVotingContract.CONTRIBUTION_CONTRACT_ADDRESS()) ===
                this.contributionContract.address
        );
        assert(
            (await this.contributionVotingContract.TREASURY_CONTRACT_ADDRESS()) ===
                this.treasuryContract.address
        );
        assert(
            (await this.ordersContract.TREASURY_CONTRACT_ADDRESS()) ===
                this.treasuryContract.address
        );
        assert(
            (await this.treasuryContract.CONTRIBUTION_VOTING_CONTRACT_ADDRESS()) ===
                this.contributionVotingContract.address
        );
    });
});

