const setup = require("../../utils/deployContracts");
const helper = require("../../utils/helper");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;
const agreementAbi = require("../../../build/AgreementContract.json");

contract("Governance Contract", function() {
    before(setup);

    let snapShot, snapshotId;
    beforeEach(async function() {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot["result"];
    });
    afterEach(async function() {
        await helper.revertToSnapshot(snapshotId);
    });

    it("Test governance action : change minturnout for agreements contract", async function() {
        const contract = await new web3.eth.Contract(
            agreementAbi.abi,
            this.agreementContract.address
        );

        //Delegates to self
        await this.crdTokenContract.delegate(await helper.getEthAccount(0), {
            from: await helper.getEthAccount(0),
        });

        await this.treasuryCoreContract.safeTransferFrom(
            await helper.getEthAccount(0),
            await helper.getEthAccount(1),
            1,
            await web3.utils.toWei("100000"),
            "0x0"
        );
        //Delegates to self
        await this.crdTokenContract.delegate(await helper.getEthAccount(1), {
            from: await helper.getEthAccount(1),
        });

        await helper.advanceMultipleBlocks(2);

        const callData = await contract.methods.setMinTurnOut(40).encodeABI();

        const description = "Proposal #1: Changing the min turn out to 40";
        const trx = await this.crowdrecordsGovernor.propose(
            [this.agreementContract.address],
            [0],
            [callData],
            description
        );

        const proposalId = trx.receipt.logs[0].args.proposalId;
        await helper.advanceMultipleBlocks(32);

        await this.crowdrecordsGovernor.castVote(proposalId, 1, {
            from: await helper.getEthAccount(1),
        });

        await this.crowdrecordsGovernor.castVote(proposalId, 1, {
            from: await helper.getEthAccount(0),
        });

        await this.crowdrecordsGovernor.state(proposalId);

        await helper.advanceMultipleBlocks(62);
        const descriptionHash = web3.utils.sha3(description);

        await this.crowdrecordsGovernor.state(proposalId);

        await this.crowdrecordsGovernor.execute(
            [this.agreementContract.address],
            [0],
            [callData],
            descriptionHash
        );

        await expect(this.agreementContract.MIN_TURNOUT_PERCENT()).eventually.to.be.bignumber.equal(
            "40"
        );
    });
});

