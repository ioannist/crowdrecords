const ContributionContract = artifacts.require("../contracts/ContributionContract");
const RecordsContract = artifacts.require("../contracts/RecordsContract");
const TracksContract = artifacts.require("../contracts/TracksContract");
const TreasuryContract = artifacts.require("../contracts/TreasuryContract");
const VotingContract = artifacts.require("../contracts/VotingContract");

module.exports = function (deployer) {
    deployer.deploy(ContributionContract, "https://crowdrecords.com");
    deployer.deploy(RecordsContract);
    deployer.deploy(TracksContract, "https://crowdrecords.com");
    deployer.deploy(TreasuryContract);
    deployer.deploy(VotingContract);
};
