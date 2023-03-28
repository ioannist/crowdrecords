const setup = require("../../utils/deployContracts");
const helper = require("../../utils/helper");
const chai = require("chai");
const BN = require("bn.js");
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const chaiBN = require("chai-bn")(BN);
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

contract("Governance Contract", function() {
    before(setup);
    before(async function() {
        GOVERNANCE_TOKEN_BALANCE_USER1 = await web3.utils.toWei("450000");
        COMMUNITY_TOKEN_BALANCE_USER1 = await web3.utils.toWei("450000");

        contributionOwner = await helper.getEthAccount(9);
        rewardCommunityToken = await web3.utils.toWei("1000");
        rewardGovernanceToken = await web3.utils.toWei("1000");
    });

    let snapShot, snapshotId;
    beforeEach(async function() {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot["result"];
    });
    afterEach(async function() {
        await helper.revertToSnapshot(snapshotId);
    });

    it("Adding a member", async function() {
        const superUser = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);

        const tx = await this.governanceContract.add(
            await this.governanceContract.MEMBER(),
            user2,
            { from: superUser }
        );

        expectEvent(tx, "AddMember", {
            member: user2,
        });
    });

    it("Adding and then Removing a member", async function() {
        const superUser = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);

        //Adding user with MEMBER role
        await this.governanceContract.add(await this.governanceContract.MEMBER(), user2, {
            from: superUser,
        });

        const tx = await this.governanceContract.remove(
            await this.governanceContract.MEMBER(),
            user2,
            { from: superUser }
        );

        expectEvent(tx, "RemoveMember", {
            member: user2,
        });
    });

    it("Adding a superUser", async function() {
        const superUser = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);

        const tx = await this.governanceContract.add(
            await this.governanceContract.SUPER_ROLE(),
            user2,
            { from: superUser }
        );

        expectEvent(tx, "AddMember", {
            member: user2,
        });
    });

    it("Adding a superUser and removing the first super user", async function() {
        const superUser = await helper.getEthAccount(0);
        const user2 = await helper.getEthAccount(1);

        const tx = await this.governanceContract.add(
            await this.governanceContract.SUPER_ROLE(),
            user2,
            { from: superUser }
        );

        expectEvent(tx, "AddMember", {
            member: user2,
        });

        const tx2 = await this.governanceContract.remove(
            await this.governanceContract.SUPER_ROLE(),
            superUser,
            { from: user2 }
        );

        expectEvent(tx2, "RemoveMember", {
            member: superUser,
        });
    });

    context("With Member", function() {
        let snapShot2, snapshotId2;
        let memberUser, superUser;
        let user3, user4;
        beforeEach(async function() {
            const CRDTokenId = await this.treasuryContract.CRD();
            snapShot2 = await helper.takeSnapshot();
            snapshotId2 = snapShot2["result"];

            superUser = await helper.getEthAccount(0);
            memberUser = await helper.getEthAccount(1);

            user3 = await helper.getEthAccount(2);
            user4 = await helper.getEthAccount(3);

            const tx = await this.governanceContract.add(
                await this.governanceContract.MEMBER(),
                memberUser,
                { from: superUser }
            );

            expectEvent(tx, "AddMember", {
                member: memberUser,
            });

            await this.treasuryCoreContract.safeTransferFrom(
                superUser,
                memberUser,
                CRDTokenId,
                await web3.utils.toWei("100000"),
                "0x0"
            );
            await this.treasuryCoreContract.safeTransferFrom(
                superUser,
                user3,
                CRDTokenId,
                await web3.utils.toWei("100000"),
                "0x0"
            );
            await this.treasuryCoreContract.safeTransferFrom(
                superUser,
                user4,
                CRDTokenId,
                await web3.utils.toWei("100000"),
                "0x0"
            );
        });
        afterEach(async function() {
            await helper.revertToSnapshot(snapshotId2);
        });

        it("Creating voting for minTurnOut for contributionVotingContract, no votes, and ballot fails", async function() {
            const newMinTurnOut = 1000; // 10% is new value
            const contractKey = "contributionVotingContract";
            const ballotId = 1;
            const tx = await this.governanceContract.createMinTurnOutVoting(
                newMinTurnOut,
                contractKey,
                { from: memberUser }
            );

            expectEvent(tx, "VotingCreated", {
                votingParam: newMinTurnOut.toString(),
                contractKey: contractKey,
            });

            await helper.advanceMultipleBlocks(helper.PROPOSAL_VOTING_TIME + 2);

            const tx2 = await this.governanceContract.declareMinTurnOutVoting(ballotId);

            expectEvent(tx2, "VotingResult", {
                newValue: newMinTurnOut.toString(),
                contractKey: contractKey,
                result: false,
            });
        });

        it("Creating voting for minTurnOut for contributionVotingContract, and ballot wins", async function() {
            const newMinTurnOut = 1000; // 10% is new value
            const contractKey = "contributionVotingContract";
            const ballotId = 1;
            const tx = await this.governanceContract.createMinTurnOutVoting(
                newMinTurnOut,
                contractKey,
                { from: memberUser }
            );

            expectEvent(tx, "VotingCreated", {
                votingParam: newMinTurnOut.toString(),
                contractKey: contractKey,
            });

            await this.governanceContract.castVote(ballotId, true, {
                from: superUser,
            });
            await this.governanceContract.castVote(ballotId, true, {
                from: user3,
            });

            await helper.advanceMultipleBlocks(helper.PROPOSAL_VOTING_TIME + 2);

            const tx2 = await this.governanceContract.declareMinTurnOutVoting(ballotId);

            expectEvent(tx2, "VotingResult", {
                newValue: newMinTurnOut.toString(),
                contractKey: contractKey,
                result: true,
            });

            await expect(
                this.contributionVotingContract.MIN_TURNOUT_PERCENT()
            ).to.eventually.be.bignumber.equal(newMinTurnOut.toString());
        });

        it("Creating voting for deposit amount change for agreement contract, no votes, and ballot fails", async function() {
            const minDepositAmt = await web3.utils.toWei("1"); // 1 ether is the new deposit amount
            const contractKey = "agreementVotingContract";
            const ballotId = 1;
            const tx = await this.governanceContract.createDepositAmountVoting(
                minDepositAmt,
                contractKey,
                { from: memberUser }
            );

            expectEvent(tx, "VotingCreated", {
                votingParam: minDepositAmt.toString(),
                contractKey: contractKey,
            });

            await helper.advanceMultipleBlocks(helper.PROPOSAL_VOTING_TIME + 2);

            const tx2 = await this.governanceContract.declareDepositAmountVoting(ballotId);

            expectEvent(tx2, "VotingResult", {
                newValue: minDepositAmt.toString(),
                contractKey: contractKey,
                result: false,
            });
        });

        it("Creating voting for minTurnOut for agreementVotingContract, and ballot wins", async function() {
            const minDepositAmt = await web3.utils.toWei("1"); // 1 ether is the new deposit amount
            const contractKey = "agreementVotingContract";
            const ballotId = 1;
            const tx = await this.governanceContract.createDepositAmountVoting(
                minDepositAmt,
                contractKey,
                { from: memberUser }
            );

            expectEvent(tx, "VotingCreated", {
                votingParam: minDepositAmt.toString(),
                contractKey: contractKey,
            });

            await this.governanceContract.castVote(ballotId, true, {
                from: superUser,
            });
            await this.governanceContract.castVote(ballotId, true, {
                from: user3,
            });

            await helper.advanceMultipleBlocks(helper.PROPOSAL_VOTING_TIME + 2);

            const tx2 = await this.governanceContract.declareDepositAmountVoting(ballotId);

            expectEvent(tx2, "VotingResult", {
                newValue: minDepositAmt.toString(),
                contractKey: contractKey,
                result: true,
            });

            await expect(this.agreementContract.VOTING_DEPOSIT()).to.eventually.be.bignumber.equal(
                minDepositAmt.toString()
            );
        });

        it("Creating voting for Voting Period change in agreements contract, no votes, and ballot fails", async function() {
            const votingPeriods = 2000;
            const contractKey = "agreementVotingContract";
            const ballotId = 1;
            const tx = await this.governanceContract.createVotingPeriodVoting(
                votingPeriods,
                contractKey,
                { from: memberUser }
            );

            expectEvent(tx, "VotingCreated", {
                votingParam: votingPeriods.toString(),
                contractKey: contractKey,
            });

            await helper.advanceMultipleBlocks(helper.PROPOSAL_VOTING_TIME + 2);

            const tx2 = await this.governanceContract.declareVotingPeriodVoting(ballotId);

            expectEvent(tx2, "VotingResult", {
                newValue: votingPeriods.toString(),
                contractKey: contractKey,
                result: false,
            });
        });

        it("Creating voting for voting time change for agreements contract, and ballot wins", async function() {
            const votingPeriod = 2000;
            const contractKey = "agreementVotingContract";
            const ballotId = 1;
            const tx = await this.governanceContract.createVotingPeriodVoting(
                votingPeriod,
                contractKey,
                { from: memberUser }
            );

            expectEvent(tx, "VotingCreated", {
                votingParam: votingPeriod.toString(),
                contractKey: contractKey,
            });

            await this.governanceContract.castVote(ballotId, true, {
                from: superUser,
            });
            await this.governanceContract.castVote(ballotId, true, {
                from: user3,
            });

            await helper.advanceMultipleBlocks(helper.PROPOSAL_VOTING_TIME + 2);

            const tx2 = await this.governanceContract.declareVotingPeriodVoting(ballotId);

            expectEvent(tx2, "VotingResult", {
                newValue: votingPeriod.toString(),
                contractKey: contractKey,
                result: true,
            });

            await expect(
                this.agreementContract.VOTING_BLOCK_PERIOD()
            ).to.eventually.be.bignumber.equal(votingPeriod.toString());
        });
    });
});

