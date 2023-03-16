const setup = require("../../utils/deployContracts");
const {
    generateTokens,
    SEED_CONTRIBUTION_ID,
    NEW_CONTRIBUTION_1_ID,
    RECORD_ID,
    COMMUNITY_TOKEN_ID,
    GOVERNANCE_TOKEN_ID,
    GOVERNANCE_TOKEN_BALANCE_USER1,
    COMMUNITY_TOKEN_BALANCE_USER1,
} = require("./generateTokens");
const helper = require("../../utils/helper");
const chai = require("chai");
const BN = require("bn.js");
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const chaiBN = require("chai-bn")(BN);
const chaiAsPromised = require("chai-as-promised");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
chai.use(chaiAsPromised);
const expect = chai.expect;

contract("Dilution Contract", function() {
    before(setup);
    before(generateTokens);

    let snapShot, snapshotId;
    beforeEach(async function() {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot["result"];
    });
    afterEach(async function() {
        await helper.revertToSnapshot(snapshotId);
    });

    it("Create request with invalid tokenId, reject", async function() {
        await expect(
            this.dilutionContract.createDilutionRequest(
                RECORD_ID,
                10,
                await web3.utils.toWei("450000"),
                { value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT }
            )
        ).to.eventually.be.rejectedWith("INVALID: TOKEN_OR_RECORD");
    });

    it("Create a request without owning the token, reject", async function() {
        await expect(
            this.dilutionContract.createDilutionRequest(
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("450000"),
                {
                    from: await helper.getEthAccount(5),
                    value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT,
                }
            )
        ).to.eventually.be.rejectedWith("INVALID: NO_TOKENS_FOUND");
    });

    it("Dilution by voting, wins with votes", async function() {
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);
        const dilutionId = "1";
        const afterDilution = await web3.utils.toWei("1000000");

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0x0"
        );

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0x0"
        );

        await this.dilutionContract.createDilutionRequest(
            RECORD_ID,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("450000"),
            {
                from: user2,
                value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT,
            }
        );

        await this.dilutionContract.castVote(dilutionId, true);

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        const tx = await this.dilutionContract.declareWinner(dilutionId);

        await expect(
            this.treasuryContract.balanceOf(this.treasuryCoreContract.address, COMMUNITY_TOKEN_ID)
        ).to.eventually.be.bignumber.equals(afterDilution);

        expectEvent(tx, "DilutionResult", {
            dilutionId: dilutionId,
            result: true,
        });
    });

    it("Dilution by voting, lose with votes", async function() {
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);
        const dilutionId = "1";
        const afterDilution = await web3.utils.toWei("550000");

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0x0"
        );

        await this.treasuryCoreContract.safeTransferFrom(
            user1,
            user3,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0x0"
        );

        await this.dilutionContract.createDilutionRequest(
            RECORD_ID,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("450000"),
            { from: user2, value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT }
        );

        await this.dilutionContract.castVote(dilutionId, false);

        await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

        const tx = await this.dilutionContract.declareWinner(dilutionId);

        await expect(
            this.treasuryContract.balanceOf(this.treasuryCoreContract.address, COMMUNITY_TOKEN_ID)
        ).to.eventually.be.bignumber.equals(afterDilution);

        expectEvent(tx, "DilutionResult", {
            dilutionId: dilutionId,
            result: false,
        });
    });

    describe("Dilution by voting", function() {
        let snapShot2, snapshotId2;
        beforeEach(async function() {
            snapShot2 = await helper.takeSnapshot();
            snapshotId2 = snapShot2["result"];

            this.user1 = await helper.getEthAccount(0);
            this.user2 = await helper.getEthAccount(1);
            this.user3 = await helper.getEthAccount(2);
            this.dilutionId = "1";

            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0x0"
            );

            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user3,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0x0"
            );

            await this.dilutionContract.createDilutionRequest(
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("450000"),
                { from: this.user2, value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT }
            );
        });
        afterEach(async function() {
            await helper.revertToSnapshot(snapshotId2);
        });

        it("shifting weight of votes, wins the ballot", async function() {
            const afterDilution = await web3.utils.toWei("1000000");
            const txx = await this.dilutionContract.castVote(this.dilutionId, false, {
                from: this.user1,
            });
            expectEvent(txx, "DilutionVoting");
            await this.dilutionContract.castVote(this.dilutionId, true, { from: this.user2 });
            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user3 });

            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("420000"),
                "0x0"
            );

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            const tx = await this.dilutionContract.declareWinner(this.dilutionId);

            expectEvent(tx, "DilutionResult", {
                dilutionId: this.dilutionId,
                result: true,
            });

            await expect(
                this.treasuryContract.balanceOf(
                    this.treasuryCoreContract.address,
                    COMMUNITY_TOKEN_ID
                )
            ).to.eventually.be.bignumber.equals(afterDilution);
        });

        it("shifting weight of votes before other votes are made, wins the ballot", async function() {
            const afterDilution = await web3.utils.toWei("1000000");
            const txx = await this.dilutionContract.castVote(this.dilutionId, false, {
                from: this.user1,
            });
            expectEvent(txx, "DilutionVoting");

            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user3 });
            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("420000"),
                "0x0"
            );
            await this.dilutionContract.castVote(this.dilutionId, true, { from: this.user2 });

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            const tx = await this.dilutionContract.declareWinner(this.dilutionId);

            expectEvent(tx, "DilutionResult", {
                dilutionId: this.dilutionId,
                result: true,
            });

            await expect(
                this.treasuryContract.balanceOf(
                    this.treasuryCoreContract.address,
                    COMMUNITY_TOKEN_ID
                )
            ).to.eventually.be.bignumber.equals(afterDilution);
        });

        it("shifting weight of votes, lose the ballot", async function() {
            const afterDilution = await web3.utils.toWei("550000");
            const user4 = await helper.getEthAccount(3);
            await this.dilutionContract.castVote(this.dilutionId, true, { from: this.user1 });
            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user2 });
            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user3 });

            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("300000"),
                "0x0"
            );

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            const tx = await this.dilutionContract.declareWinner(this.dilutionId);

            await expect(
                this.treasuryContract.balanceOf(
                    this.treasuryCoreContract.address,
                    COMMUNITY_TOKEN_ID
                )
            ).to.eventually.be.bignumber.equals(afterDilution);

            expectEvent(tx, "DilutionResult", {
                dilutionId: this.dilutionId,
                result: false,
            });
        });

        it("shifting weight of votes before other votes are made, lose the ballot", async function() {
            const afterDilution = await web3.utils.toWei("550000");
            const user4 = await helper.getEthAccount(3);
            await this.dilutionContract.castVote(this.dilutionId, true, { from: this.user1 });

            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                this.user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("300000"),
                "0x0"
            );

            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user2 });
            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user3 });

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            const tx = await this.dilutionContract.declareWinner(this.dilutionId);

            await expect(
                this.treasuryContract.balanceOf(
                    this.treasuryCoreContract.address,
                    COMMUNITY_TOKEN_ID
                )
            ).to.eventually.be.bignumber.equals(afterDilution);

            expectEvent(tx, "DilutionResult", {
                dilutionId: this.dilutionId,
                result: false,
            });
        });

        it("Dilution voting done, ballot lost, trying to create a new dilution request before set time, reject", async function() {
            const afterDilution = await web3.utils.toWei("550000");
            const user4 = await helper.getEthAccount(3);
            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user1 });
            await this.dilutionContract.castVote(this.dilutionId, true, { from: this.user2 });
            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user3 });

            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                user4,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("300000"),
                "0x0"
            );

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            const tx = await this.dilutionContract.declareWinner(this.dilutionId);

            await expect(
                this.treasuryContract.balanceOf(
                    this.treasuryCoreContract.address,
                    COMMUNITY_TOKEN_ID
                )
            ).to.eventually.be.bignumber.equals(afterDilution);

            expectEvent(tx, "DilutionResult", {
                dilutionId: this.dilutionId,
                result: false,
            });

            await expect(
                this.dilutionContract.createDilutionRequest(
                    RECORD_ID,
                    COMMUNITY_TOKEN_ID,
                    await web3.utils.toWei("450000"),
                    { from: this.user2, value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT }
                )
            ).to.eventually.be.rejectedWith("INVALID: WAIT_SOMETIME_BEFORE_NEW_DILUTION_REQUEST");
        });

        it("Dilution voting done, ballot won, trying to create a new dilution request before set time, reject", async function() {
            const afterDilution = await web3.utils.toWei("1000000");
            const user4 = await helper.getEthAccount(3);
            await this.dilutionContract.castVote(this.dilutionId, true, { from: this.user1 });
            await this.dilutionContract.castVote(this.dilutionId, true, { from: this.user2 });
            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user3 });

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            const tx = await this.dilutionContract.declareWinner(this.dilutionId);

            await expect(
                this.treasuryContract.balanceOf(
                    this.treasuryCoreContract.address,
                    COMMUNITY_TOKEN_ID
                )
            ).to.eventually.be.bignumber.equals(afterDilution);

            expectEvent(tx, "DilutionResult", {
                dilutionId: this.dilutionId,
                result: true,
            });

            await expect(
                this.dilutionContract.createDilutionRequest(
                    RECORD_ID,
                    COMMUNITY_TOKEN_ID,
                    await web3.utils.toWei("450000"),
                    { from: this.user2, value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT }
                )
            ).to.eventually.be.rejectedWith("INVALID: WAIT_SOMETIME_BEFORE_NEW_DILUTION_REQUEST");
        });

        it("Dilution voting done, ballot lost, trying to create a new dilution request after set time, creates successfully", async function() {
            const afterDilution = await web3.utils.toWei("550000");
            const newDilutionId = "2";
            const user4 = await helper.getEthAccount(3);
            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user1 });
            await this.dilutionContract.castVote(this.dilutionId, true, { from: this.user2 });
            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user3 });

            await this.treasuryCoreContract.safeTransferFrom(
                this.user1,
                user4,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("300000"),
                "0x0"
            );

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            const tx = await this.dilutionContract.declareWinner(this.dilutionId);

            await expect(
                this.treasuryContract.balanceOf(
                    this.treasuryCoreContract.address,
                    COMMUNITY_TOKEN_ID
                )
            ).to.eventually.be.bignumber.equals(afterDilution);

            expectEvent(tx, "DilutionResult", {
                dilutionId: this.dilutionId,
                result: false,
            });

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 1000);

            const tx2 = await this.dilutionContract.createDilutionRequest(
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("450000"),
                { from: this.user2, value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT }
            );

            expectEvent(tx2, "DilutionRequestCreated", { dilutionId: newDilutionId });
        });

        it("Dilution voting done, ballot won, trying to create a new dilution request after set time, creates successfully", async function() {
            const afterDilution = await web3.utils.toWei("1000000");
            const newDilutionId = "2";
            const user4 = await helper.getEthAccount(3);
            await this.dilutionContract.castVote(this.dilutionId, true, { from: this.user1 });
            await this.dilutionContract.castVote(this.dilutionId, true, { from: this.user2 });
            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user3 });

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            const tx = await this.dilutionContract.declareWinner(this.dilutionId);

            await expect(
                this.treasuryContract.balanceOf(
                    this.treasuryCoreContract.address,
                    COMMUNITY_TOKEN_ID
                )
            ).to.eventually.be.bignumber.equals(afterDilution);

            expectEvent(tx, "DilutionResult", {
                dilutionId: this.dilutionId,
                result: true,
            });

            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 1000);

            const tx2 = await this.dilutionContract.createDilutionRequest(
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("450000"),
                { from: this.user2, value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT }
            );

            expectEvent(tx2, "DilutionRequestCreated", { dilutionId: newDilutionId });
        });
    });
});

