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

    it("Create request to mint more than 1 billion token, reject", async function() {
        await expect(
            this.dilutionContract.createDilutionRequest(
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("1000000001"),
                { value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT }
            )
        ).to.eventually.be.rejectedWith("INVALID: SUPPLY_LIMIT_REACHED");
    });

    it("Create request to mint token, new total supply would be more than 1 Billion, reject", async function() {
        await expect(
            this.dilutionContract.createDilutionRequest(
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("999000001"), // Already 1 Million tokens have been minted, now we required to mint 999,000,001 which makes total supply more than 1 billion
                { value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT }
            )
        ).to.eventually.be.rejectedWith("INVALID: SUPPLY_LIMIT_REACHED");
    });

    it("Create request to mint token, new total supply would be less than 1 Billion", async function() {
        this.dilutionContract.createDilutionRequest(
            RECORD_ID,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("998000001"), // Already 1 Million tokens have been minted
            { value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT }
        );
    });

    it("Create request to mint token, new total supply would be exactly 1 Billion", async function() {
        this.dilutionContract.createDilutionRequest(
            RECORD_ID,
            COMMUNITY_TOKEN_ID,
            await web3.utils.toWei("999000000"), // Already 1 Million tokens have been minted
            { value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT }
        );
    });

    it("Create request to mint more than 1 billion token, reject", async function() {
        await expect(
            this.dilutionContract.createDilutionRequest(
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("1000000000"),
                { value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT }
            )
        ).to.eventually.be.rejectedWith("INVALID: SUPPLY_LIMIT_REACHED");
    });

    it("Passing the MAX_INT to the payload of createDilutionRequest, should reject", async function() {
        const maxIntAmount = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
        await expect(
            this.dilutionContract.createDilutionRequest(
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                maxIntAmount,
                { value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT }
            )
        ).to.eventually.be.rejectedWith("Panic: Arithmetic overflow");
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

        it("Dilution voting with large number of voters (2000 Voters)", async function() {
            this.userList = [];
            this.votesList = [];

            // Creating 2000 users and their respective votes
            this.userList = helper.generateAccounts(2000);
            for (let i = 0; i < 2000; i++) {
                // Assuming votes are randomly true or false
                this.votesList.push(Math.random() > 0.5);
            }

            this.dilutionId = "1";

            // Transferring tokens to these users from user1
            for (let i = 0; i < this.userList.length; i++) {
                await this.treasuryCoreContract.safeTransferFrom(
                    this.user1,
                    this.userList[i],
                    COMMUNITY_TOKEN_ID,
                    await web3.utils.toWei("225"),
                    "0x0"
                );
            }

            // Creating a dilution request
            await this.dilutionContract.createDilutionRequest(
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("450000"),
                { from: this.user1, value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT }
            );

            const expectedOutcome =
                this.votesList.filter((vote) => vote).length > this.votesList.length * 0.66; // We require at least two third to declare someone winner

            // All users casting votes
            for (let i = 0; i < this.userList.length; i++) {
                const trx = await this.dilutionContract.castVote(
                    this.dilutionId,
                    this.votesList[i],
                    {
                        from: this.userList[i],
                    }
                );
                expectEvent(trx, "DilutionVoting", {
                    dilutionId: this.dilutionId,
                });
            }

            // Advancing blocks
            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            // Declare the winner
            const tx = await this.dilutionContract.declareWinner(this.dilutionId);

            expectEvent(tx, "DilutionResult", {
                dilutionId: this.dilutionId,
                result: expectedOutcome,
            });
        });

        it("Multiple dilution voting with large number of voters (2000 voters)", async function() {
            this.userList = [];
            this.votesList1 = [];
            this.votesList2 = [];

            // Creating 2000 users and their respective votes for 2 dilution requests
            this.userList = helper.generateAccounts(2000);
            for (let i = 0; i < 2000; i++) {
                // Assuming votes are randomly true or false
                this.votesList1.push(Math.random() > 0.5);
                this.votesList2.push(Math.random() > 0.5);
            }

            this.dilutionId1 = "1";
            this.dilutionId2 = "2";

            // Transferring tokens to these users from user1
            for (let i = 0; i < this.userList.length; i++) {
                await this.treasuryCoreContract.safeTransferFrom(
                    this.user1,
                    this.userList[i],
                    COMMUNITY_TOKEN_ID,
                    await web3.utils.toWei("225"),
                    "0x0"
                );
            }

            // Creating two dilution requests
            await this.dilutionContract.createDilutionRequest(
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("450000"),
                { from: this.user1, value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT }
            );
            await this.dilutionContract.createDilutionRequest(
                RECORD_ID,
                COMMUNITY_TOKEN_ID,
                await web3.utils.toWei("450000"),
                { from: this.user1, value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT }
            );

            // Calculate the expected outcome for each vote
            const expectedOutcome1 =
                this.votesList1.filter((vote) => vote).length > this.votesList1.length * 0.66; // We require at least two third to declare someone winner
            const expectedOutcome2 =
                this.votesList2.filter((vote) => vote).length > this.votesList2.length * 0.66; // We require at least two third to declare someone winner

            // All users casting votes on both dilution requests
            for (let i = 0; i < this.userList.length; i++) {
                await this.dilutionContract.castVote(this.dilutionId1, this.votesList1[i], {
                    from: this.userList[i],
                });
                await this.dilutionContract.castVote(this.dilutionId2, this.votesList2[i], {
                    from: this.userList[i],
                });
            }

            // Advancing blocks
            await helper.advanceMultipleBlocks(helper.VOTING_INTERVAL_BLOCKS + 2);

            // Declare the winners
            const tx1 = await this.dilutionContract.declareWinner(this.dilutionId1);
            const tx2 = await this.dilutionContract.declareWinner(this.dilutionId2);

            // Verifying the events have the correct results
            expectEvent(tx1, "DilutionResult", {
                dilutionId: this.dilutionId1,
                result: expectedOutcome1,
            });
            expectEvent(tx2, "DilutionResult", {
                dilutionId: this.dilutionId2,
                result: expectedOutcome2,
            });
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
                    {
                        from: this.user2,
                        value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT,
                        gas: 10_000_000,
                    }
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
                    {
                        from: this.user2,
                        value: helper.VOTING_DEPOSIT_DILUTION_CONTRACT,
                        gas: 10_000_000,
                    }
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

