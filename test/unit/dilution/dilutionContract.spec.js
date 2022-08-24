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
                await web3.utils.toWei("450000")
            )
        ).to.eventually.be.rejectedWith("Invalid token or record");
    });

    it("Create a request without owning the token, reject", async function() {
        await expect(
            this.dilutionContract.createDilutionRequest(
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("450000"),
                { from: await helper.getEthAccount(5) }
            )
        ).to.eventually.be.rejectedWith("You cannot create dilution request");
    });

    it("Dilution by voting, wins with votes", async function() {
        const user1 = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);
        const user3 = await helper.getEthAccount(2);
        const dilutionId = "1";
        const afterDilution = await web3.utils.toWei("1000000");

        await this.treasuryContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0x0"
        );

        await this.treasuryContract.safeTransferFrom(
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
            { from: user2 }
        );

        await this.dilutionContract.castVote(dilutionId, true);

        await helper.advanceMultipleBlocks(50);

        const tx = await this.dilutionContract.declareWinner(dilutionId);

        expect(
            this.treasuryContract.balanceOf(this.treasuryContract.address, COMMUNITY_TOKEN_ID)
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

        await this.treasuryContract.safeTransferFrom(
            user1,
            user2,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("5000"),
            "0x0"
        );

        await this.treasuryContract.safeTransferFrom(
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
            { from: user2 }
        );

        await this.dilutionContract.castVote(dilutionId, false);

        await helper.advanceMultipleBlocks(50);

        const tx = await this.dilutionContract.declareWinner(dilutionId);

        expect(
            this.treasuryContract.balanceOf(this.treasuryContract.address, COMMUNITY_TOKEN_ID)
        ).to.eventually.be.bignumber.equals(afterDilution);

        expectEvent(tx, "DilutionResult", {
            dilutionId: dilutionId,
            result: false,
        });
    });

    context("Dilution by voting", function() {
        let snapShot2, snapshotId2;
        beforeEach(async function() {
            snapShot2 = await helper.takeSnapshot();
            snapshotId2 = snapShot2["result"];

            this.user1 = await helper.getEthAccount(0);
            this.user2 = await helper.getEthAccount(1);
            this.user3 = await helper.getEthAccount(2);
            this.dilutionId = "1";

            await this.treasuryContract.safeTransferFrom(
                this.user1,
                this.user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("5000"),
                "0x0"
            );

            await this.treasuryContract.safeTransferFrom(
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
                { from: this.user2 }
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

            await this.treasuryContract.safeTransferFrom(
                this.user1,
                this.user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("420000"),
                "0x0"
            );

            await helper.advanceMultipleBlocks(50);

            const tx = await this.dilutionContract.declareWinner(this.dilutionId);

            expectEvent(tx, "DilutionResult", {
                dilutionId: this.dilutionId,
                result: true,
            });

            await expect(
                this.treasuryContract.balanceOf(this.treasuryContract.address, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(afterDilution);
        });

        it("shifting weight of votes, lose the ballot", async function() {
            const afterDilution = await web3.utils.toWei("550000");
            const user4 = await helper.getEthAccount(3);
            await this.dilutionContract.castVote(this.dilutionId, true, { from: this.user1 });
            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user2 });
            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user3 });

            await this.treasuryContract.safeTransferFrom(
                this.user1,
                this.user2,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("300000"),
                "0x0"
            );

            await helper.advanceMultipleBlocks(50);

            const tx = await this.dilutionContract.declareWinner(this.dilutionId);

            expect(
                this.treasuryContract.balanceOf(this.treasuryContract.address, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(afterDilution);

            expectEvent(tx, "DilutionResult", {
                dilutionId: this.dilutionId,
                result: false,
            });
        });

        it("Dilution voting done, trying to create a new dilution request before set time, reject", async function() {
            const afterDilution = await web3.utils.toWei("550000");
            const user4 = await helper.getEthAccount(3);
            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user1 });
            await this.dilutionContract.castVote(this.dilutionId, true, { from: this.user2 });
            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user3 });

            await this.treasuryContract.safeTransferFrom(
                this.user1,
                user4,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("300000"),
                "0x0"
            );

            await helper.advanceMultipleBlocks(50);

            const tx = await this.dilutionContract.declareWinner(this.dilutionId);

            await expect(
                this.treasuryContract.balanceOf(this.treasuryContract.address, COMMUNITY_TOKEN_ID)
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
                    { from: this.user2 }
                )
            ).to.eventually.be.rejectedWith(
                "You need to wait sometime for you create new dilution request"
            );
        });

        it("Dilution voting done, trying to create a new dilution request after set time, creates successfully", async function() {
            const afterDilution = await web3.utils.toWei("550000");
            const newDilutionId = "2";
            const user4 = await helper.getEthAccount(3);
            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user1 });
            await this.dilutionContract.castVote(this.dilutionId, true, { from: this.user2 });
            await this.dilutionContract.castVote(this.dilutionId, false, { from: this.user3 });

            await this.treasuryContract.safeTransferFrom(
                this.user1,
                user4,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("300000"),
                "0x0"
            );

            await helper.advanceMultipleBlocks(50);

            const tx = await this.dilutionContract.declareWinner(this.dilutionId);

            await expect(
                this.treasuryContract.balanceOf(this.treasuryContract.address, COMMUNITY_TOKEN_ID)
            ).to.eventually.be.bignumber.equals(afterDilution);

            expectEvent(tx, "DilutionResult", {
                dilutionId: this.dilutionId,
                result: false,
            });

            await helper.advanceMultipleBlocks(1000);

            const tx2 = await this.dilutionContract.createDilutionRequest(
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("450000"),
                { from: this.user2 }
            );

            expectEvent(tx2, "DilutionRequestCreated", { dilutionId: newDilutionId });
        });
    });
});

