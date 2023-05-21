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
        expect(this.recordsVotingContract.address).to.not.equal("");
        expect(this.crdTokenContract.address).to.not.equal("");
        expect(this.treasuryCoreContract.address).to.not.equal("");
        expect(this.baseVotingContractMock.address).to.not.equal("");
        expect(this.baseVotingCounterOfferContractMock.address).to.not.equal("");
        expect(this.dilutionContract.address).to.not.equal("");
        expect(this.votingHubContract.address).to.not.equal("");
        expect(this.crowdrecordsGovernor.address).to.not.equal("");
        expect(this.controllerContract.address).to.not.equal("");
    });

    it("check if address for contributionContract is set", async function() {
        await expect(
            this.contributionContract.CONTRIBUTION_VOTING_CONTRACT_ADDRESS()
        ).eventually.to.be.equal(this.contributionVotingContract.address);

        await expect(this.contributionContract.RECORD_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.recordsContract.address
        );

        await expect(this.contributionContract.TRACKS_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.tracksContract.address
        );

        await expect(
            this.contributionContract.CONTROLLER_CONTRACT_ADDRESS()
        ).eventually.to.be.equal(this.controllerContract.address);
    });

    it("check if address for recordsContract is set", async function() {
        await expect(this.recordsContract.CONTRIBUTION_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.contributionContract.address
        );
        await expect(this.recordsContract.RECORDS_VOTING_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.recordsVotingContract.address
        );
        await expect(this.recordsContract.CONTROLLER_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.controllerContract.address
        );
        await expect(this.recordsContract.CONTROLLER_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.controllerContract.address
        );
    });

    it("check if address for recordsVotingContract is set", async function() {
        await expect(this.recordsVotingContract.RECORDS_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.recordsContract.address
        );
        await expect(this.recordsVotingContract.TREASURY_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryContract.address
        );
        await expect(
            this.recordsVotingContract.TREASURY_CORE_CONTRACT_ADDRESS()
        ).eventually.to.be.equal(this.treasuryCoreContract.address);
        await expect(this.recordsVotingContract.GOVERNANCE()).eventually.to.be.equal(
            this.crowdrecordsGovernor.address
        );
    });

    it("check if address for contributionVotingContract is set", async function() {
        await expect(
            this.contributionVotingContract.CONTRIBUTION_CONTRACT_ADDRESS()
        ).eventually.to.be.equal(this.contributionContract.address);

        await expect(
            this.contributionVotingContract.TREASURY_CONTRACT_ADDRESS()
        ).eventually.to.be.equal(this.treasuryContract.address);

        await expect(this.contributionVotingContract.GOVERNANCE()).eventually.to.be.equal(
            this.crowdrecordsGovernor.address
        );
    });

    it("check if address for ordersContract is set", async function() {
        await expect(this.ordersContract.TREASURY_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryContract.address
        );
        await expect(this.ordersContract.TREASURY_CORE_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryCoreContract.address
        );
    });

    it("check if address for agreementContract is set", async function() {
        await expect(this.agreementContract.TREASURY_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryContract.address
        );
        await expect(
            this.agreementContract.TREASURY_CORE_CONTRACT_ADDRESS()
        ).eventually.to.be.equal(this.treasuryCoreContract.address);

        await expect(this.agreementContract.GOVERNANCE()).eventually.to.be.equal(
            this.crowdrecordsGovernor.address
        );
    });

    it("check if address for baseVotingContractMock is set", async function() {
        await expect(
            this.baseVotingContractMock.TREASURY_CONTRACT_ADDRESS()
        ).eventually.to.be.equal(this.treasuryContract.address);
    });

    it("check if address for dilutionContract is set", async function() {
        await expect(this.dilutionContract.TREASURY_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryContract.address
        );
        await expect(this.dilutionContract.GOVERNANCE()).eventually.to.be.equal(
            this.crowdrecordsGovernor.address
        );
    });

    it("check if address for treasuryContract is set", async function() {
        await expect(this.treasuryContract.TREASURY_CORE_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryCoreContract.address
        );
        await expect(this.treasuryContract.RECORDS_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.recordsContract.address
        );
        await expect(
            this.treasuryContract.RECORDS_VOTING_CONTRACT_ADDRESS()
        ).eventually.to.be.equal(this.recordsVotingContract.address);
        await expect(this.treasuryContract.DILUTION_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.dilutionContract.address
        );
        await expect(
            this.treasuryContract.CONTRIBUTION_VOTING_CONTRACT_ADDRESS()
        ).eventually.to.be.equal(this.contributionVotingContract.address);

        await expect(this.treasuryContract.SNAPSHOT_CALLER(0)).eventually.to.be.equal(
            this.agreementContract.address
        );
        await expect(this.treasuryContract.SNAPSHOT_CALLER(1)).eventually.to.be.equal(
            this.recordsVotingContract.address
        );
    });

    it("check if address for baseVotingCounterOfferContractMock set", async function() {
        await expect(
            this.baseVotingCounterOfferContractMock.TREASURY_CONTRACT_ADDRESS()
        ).eventually.to.be.equal(this.treasuryContract.address);
    });

    it("check if address for votingHubContract set", async function() {
        await expect(
            this.votingHubContract.TREASURY_CORE_CONTRACT_ADDRESS()
        ).eventually.to.be.equal(this.treasuryCoreContract.address);

        await expect(this.votingHubContract.VOTING_CONTRACTS_ADDRESS(0)).eventually.to.be.equal(
            this.contributionVotingContract.address
        );
        await expect(this.votingHubContract.VOTING_CONTRACTS_ADDRESS(1)).eventually.to.be.equal(
            this.agreementContract.address
        );
        await expect(this.votingHubContract.VOTING_CONTRACTS_ADDRESS(2)).eventually.to.be.equal(
            this.dilutionContract.address
        );
        await expect(this.votingHubContract.VOTING_CONTRACTS_ADDRESS(3)).eventually.to.be.equal(
            this.recordsVotingContract.address
        );
    });

    it("check if address for treasuryCoreContract set", async function() {
        await expect(this.treasuryCoreContract.VOTING_HUB_ADDRESS()).eventually.to.be.equal(
            this.votingHubContract.address
        );
        await expect(this.treasuryCoreContract.TREASURY_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryContract.address
        );
        await expect(
            this.treasuryCoreContract.CONTROLLER_CONTRACT_ADDRESS()
        ).eventually.to.be.equal(this.controllerContract.address);
    });
    it("check if address for crdTokenContract set", async function() {
        await expect(this.crdTokenContract.TREASURY_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryContract.address
        );
        await expect(this.crdTokenContract.TREASURY_CORE_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.treasuryCoreContract.address
        );
        await expect(this.crdTokenContract.AGREEMENTS_CONTRACT_ADDRESS()).eventually.to.be.equal(
            this.agreementContract.address
        );
    });
});

