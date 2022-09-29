const chai = require("chai");
const BN = require("bn.js");
const chaiBN = require("chai-bn")(BN);
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
const timeMachine = require("../../utils/helper");
const setup = require("../../utils/deployContracts");
const helper = require("../../utils/helper");
const ERC20SnapshotMock = artifacts.require("ERC20SnapshotMock");
const { expectEvent, expectRevert } = require("@openzeppelin/test-helpers");

chai.use(chaiBN);
chai.use(chaiAsPromised);

contract("All Contract Deployment", function() {
    before(setup);
    let snapShot, snapshotId;
    beforeEach(async function() {
        const initialHolder = await helper.getEthAccount(0);
        const recipient = await helper.getEthAccount(1);
        const other = await helper.getEthAccount(2);
        const initialTokenId = 1;
        const secondTokenId = 2;

        const initialSupply = new BN(100);
        const initialSupplySecondToken = new BN(0);

        const uri = "DummyURI";
        snapShot = await timeMachine.takeSnapshot();
        snapshotId = snapShot["result"];
        this.token = await ERC20SnapshotMock.new(uri, initialHolder, initialSupply);
    });
    afterEach(async function() {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    it("Should deploy all contracts", async function() {
        expect(this.tracksContract.address).to.not.equal("");
        expect(this.contributionContract.address).to.not.equal("");
        expect(this.recordsContract.address).to.not.equal("");
        expect(this.treasuryContract.address).to.not.equal("");
        expect(this.contributionVotingContract.address).to.not.equal("");
        expect(this.ordersContract.address).to.not.equal("");
        expect(this.agreementContract.address).to.not.equal("");
    });

    it("All address set", async function() {
        expect(
            this.contributionContract.CONTRIBUTION_VOTING_CONTRACT_ADDRESS()
        ).eventually.to.be.equal(this.contributionVotingContract.address);

        expect(this.contributionContract.RECORD_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.recordsContract.address
        );

        expect(this.recordsContract.CONTRIBUTION_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.contributionContract.address
        );
        expect(this.recordsContract.TREASURY_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryContract.address
        );
        expect(this.recordsContract.TREASURY_CORE_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryCoreContract.address
        );

        expect(
            this.contributionVotingContract.CONTRIBUTION_CONTRACT_ADDRESS()
        ).eventually.to.be.equal(this.contributionContract.address);

        expect(this.contributionVotingContract.TREASURY_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryContract.address
        );

        expect(this.ordersContract.TREASURY_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryContract.address
        );
        expect(this.ordersContract.TREASURY_CORE_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryCoreContract.address
        );

        expect(this.agreementContract.TREASURY_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryContract.address
        );
        expect(this.agreementContract.TREASURY_CORE_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryCoreContract.address
        );

        expect(this.baseVotingContractMock.TREASURY_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryContract.address
        );

        expect(this.dilutionContract.TREASURY_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryContract.address
        );

        expect(this.treasuryContract.RECORDS_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.recordsContract.address
        );
        expect(this.treasuryContract.CONTRIBUTION_VOTING_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.contributionVotingContract.address
        );
        expect(this.treasuryContract.DILUTION_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.dilutionContract.address
        );
        expect(this.treasuryContract.TREASURY_CORE_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryCoreContract.address
        );

        expect(
            this.baseVotingCounterOfferContractMock.TREASURY_CONTRACT_ADDRESS()
        ).eventually.to.be.equal(this.treasuryContract.address);

        expect(this.votingHubContract.TREASURY_CORE_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryCoreContract.address
        );

        expect(this.votingHubContract.VOTING_CONTRACTS_ADDRESS(0)).eventually.to.be.equal(
            this.contributionVotingContract.address
        );
        expect(this.votingHubContract.VOTING_CONTRACTS_ADDRESS(1)).eventually.to.be.equal(
            this.agreementContract.address
        );

        expect(this.recordsContract.TREASURY_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryContract.address
        );

        expect(this.treasuryCoreContract.VOTING_HUB_ADDRESS()).eventually.to.be.equal(
            this.votingHubContract.address
        );
        expect(this.treasuryCoreContract.TREASURY_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryContract.address
        );
    });
});

