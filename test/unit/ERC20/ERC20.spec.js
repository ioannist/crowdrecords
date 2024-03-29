const setup = require("../../utils/deployContracts");
const helper = require("../../utils/helper");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const expect = chai.expect;
const BN = require("bn.js");
const chaiBN = require("chai-bn")(BN);
chai.use(chaiBN);
chai.use(chaiAsPromised);

contract("ERC20 Transfer Test", function() {
    before(setup);

    let snapShot, snapshotId;
    beforeEach(async function() {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot["result"];
    });
    afterEach(async function() {
        await helper.revertToSnapshot(snapshotId);
    });

    it("Can transfer directly from ERC20 contract", async function() {
        const user2 = await helper.getEthAccount(1);
        await this.crdTokenContract.transfer(user2, "10000");
        await expect(await this.crdTokenContract.balanceOf(user2)).to.be.bignumber.equal("10000");
    });

    it("Can transfer tokens through treasury core contract", async function() {
        const CRDToken = await this.treasuryContract.CRD();
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        await this.treasuryCoreContract.safeTransferFrom(user1, user2, CRDToken, "10000", "0xa165");
        await expect(await this.crdTokenContract.balanceOf(user2)).to.be.bignumber.equal("10000");
    });
});

