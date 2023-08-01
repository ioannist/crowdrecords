const setup = require("../../utils/deployContracts");
const helper = require("../../utils/helper");
const chai = require("chai");
const BN = require("bn.js");
const chaiBN = require("chai-bn")(BN);
const chaiAsPromised = require("chai-as-promised");
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const expect = chai.expect;
const timeMachine = require("../../utils/helper");
const TreasuryCoreMockContract = artifacts.require(
    "../../../contracts/Mocks/TreasuryCoreContractMock.sol"
);

chai.use(chaiBN);
chai.use(chaiAsPromised);

contract("Voting Hub Contract", function() {
    before(setup);
    let snapShot, snapshotId;
    beforeEach(async function() {
        snapShot = await timeMachine.takeSnapshot();
        snapshotId = snapShot["result"];
    });
    afterEach(async function() {
        await timeMachine.revertToSnapshot(snapshotId);
    });

    it("Check if only the owner can set a new owner", async function() {
        const nonOwner = await helper.getEthAccount(3);

        // Non owner user tries to set a new owner and expects revert
        await expect(
            this.votingHubContract.setOwner(nonOwner, { from: nonOwner })
        ).to.eventually.rejectedWith("UNAUTHORIZED: LACKS_PERMISSION");
    });

    it("Check if only the owner can add a new voting contract", async function() {
        const nonOwner = await helper.getEthAccount(3);
        const newContract = await helper.getEthAccount(4);

        // Non owner user tries to add a new voting contract and expects revert
        await expect(
            this.votingHubContract.addVotingContract(newContract, { from: nonOwner })
        ).to.eventually.rejectedWith("UNAUTHORIZED: LACKS_PERMISSION");
    });

    it("Check if only the owner can remove a voting contract", async function() {
        const nonOwner = await helper.getEthAccount(3);

        // Non owner user tries to remove a voting contract and expects revert
        await expect(
            this.votingHubContract.removeVotingContract(0, { from: nonOwner })
        ).to.eventually.rejectedWith("UNAUTHORIZED: LACKS_PERMISSION");
    });

    it("Check if only the owner can remove a voting contract", async function() {
        const nonOwner = await helper.getEthAccount(3);

        // Non owner user tries to remove a voting contract and expects revert
        await expect(
            this.votingHubContract.removeVotingContract(0, { from: nonOwner })
        ).to.eventually.rejectedWith("UNAUTHORIZED: LACKS_PERMISSION");
    });

    it("Attempt to add a non-contract address to the voting contracts list", async function() {
        const nonContract = await helper.getEthAccount(3);

        // Try to add a non-contract address and expect a revert
        await expect(
            this.votingHubContract.addVotingContract(nonContract)
        ).to.eventually.rejectedWith("INVALID: ONLY_CONTRACT_CAN_BE_ADDED");
    });

    it("Add a valid contract address to the voting contracts list", async function() {
        // Add a new voting contract and expect success
        const tx = await this.votingHubContract.addVotingContract(
            this.recordsVotingContract.address
        );

        await expectEvent(tx, "VotingContractAdded", {
            votingContractAddress: this.recordsVotingContract.address,
        });
    });

    it("fails when removing a contract using an out-of-bounds index", async function() {
        await expect(this.votingHubContract.removeVotingContract(9999)).to.eventually.rejectedWith(
            "INVALID: INCORRECT_INDEX"
        );
    });

    it("Fails when calling handleUserTokenTransfers with invalid parameters", async function() {
        const owner = await helper.getEthAccount(0);
        const sender = await helper.getEthAccount(2);
        const receiver = await helper.getEthAccount(3);
        const amount = new BN(10);
        const tokenId = 5;

        const treasuryCoreMockContract = await TreasuryCoreMockContract.deployed();

        await treasuryCoreMockContract.mintTokensForMe(tokenId, amount, { from: sender });
        await treasuryCoreMockContract.mintTokensForMe(tokenId, new BN(5), { from: receiver });

        // Register the Treasury Core contract with the Voting Hub
        await this.votingHubContract.setTreasuryCoreContractAddress(
            treasuryCoreMockContract.address
        );

        // Attempt to transfer more tokens than the sender has
        await expect(
            treasuryCoreMockContract.safeTransferFrom(
                sender,
                receiver,
                tokenId,
                amount + new BN(1),
                "0xa165",
                { from: sender }
            )
        ).to.eventually.rejectedWith("ERC1155: insufficient balance for transfer");
    });
});

