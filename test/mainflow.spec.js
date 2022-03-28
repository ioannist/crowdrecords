const TracksContract = artifacts.require("./contracts/TracksContract");
const ContributionContract = artifacts.require("./contracts/ContributionContract");
const RecordsContract = artifacts.require("./contracts/RecordsContract");
const TreasuryContract = artifacts.require("./contracts/TreasuryContract");
const VotingContract = artifacts.require("./contracts/VotingContract");

let tracksContract = null;
let contributionContract = null;
let recordsContract = null;
let treasuryContract = null;
let votingContract = null;

contract("AllContract", () => {
    it("Should deploy all contracts", async () => {
        tracksContract = await TracksContract.deployed("https://crowdrecords.com");
        assert(tracksContract.address !== "");

        contributionContract = await ContributionContract.deployed("https://crowdrecords.com");
        assert(contributionContract.address !== "");

        recordsContract = await RecordsContract.deployed();
        assert(recordsContract.address !== "");

        treasuryContract = await TreasuryContract.deployed();
        assert(treasuryContract.address !== "");

        votingContract = await VotingContract.deployed();
        assert(votingContract.address !== "");
    });

    it("Should set all the contracts addresses", async () => {
        await contributionContract.setVotingContractAddress(votingContract.address);
        assert((await contributionContract.VOTING_CONTRACT_ADDRESS()) === votingContract.address);

        await treasuryContract.setRecordsContractAddress(recordsContract.address);
        assert((await treasuryContract.RECORDS_CONTRACT_ADDRESS()) === recordsContract.address);

        await votingContract.setContributionContractAddress(contributionContract.address);
        assert(
            (await votingContract.CONTRIBUTION_CONTRACT_ADDRESS()) === contributionContract.address
        );
    });
});
