const ContributionContract = artifacts.require("../contracts/ContributionContract.sol");
const RecordsContract = artifacts.require("../contracts/RecordsContract.sol");
const RecordsVotingContract = artifacts.require("../contracts/RecordsVotingContract.sol");
const TracksContract = artifacts.require("../contracts/TracksContract.sol");
// const TreasuryContract = artifacts.require("../contracts/TreasuryContract.sol");
const TreasuryContract = artifacts.require("../contracts/treasury/TreasuryContract.sol");
const TreasuryCoreContract = artifacts.require("../contracts/treasury/TreasuryCoreContract.sol");
const CrdTokenContract = artifacts.require("../contracts/treasury/CrdTokenContract.Sol");
const TreasuryCoreMockContract = artifacts.require(
    "../contracts/Mocks/TreasuryCoreContractMock.sol"
);
const ContributionVotingContract = artifacts.require(
    "../contracts/voting/ContributionVotingContract.sol"
);
const OrdersContract = artifacts.require("../contracts/OrdersContract.sol");
const AgreementContract = artifacts.require("../contracts/AgreementContract.sol");

const BaseVotingContractMock = artifacts.require("../contracts/Mocks/BaseVotingContractMock.sol");
const BaseVotingCounterOfferContractMock = artifacts.require(
    "../contracts/Mocks/BaseVotingCounterOfferContractMock.sol"
);
const DilutionContract = artifacts.require("../contracts/voting/DilutionContract.Sol");
const VotingHubContract = artifacts.require("../contracts/voting/VotingHubContract.Sol");

const CrowdrecordsGovernor = artifacts.require("../contracts/governance/CrowdrecordsGovernor.sol");
const ControllerContract = artifacts.require("../contracts/ControllerContract.sol");

const {
    getEthAccount,
    VOTING_INTERVAL_BLOCKS,
    PROPOSAL_VOTING_TIME,
    GOV_VOTING_DELAY,
    GOV_VOTING_PERIOD,
    GOV_VOTING_THRESHOLD,
    DILUTION_REQUEST_INTERVAL,
} = require("../test/utils/helper");

const sleep = (time) =>
    new Promise((res, rej) => {
        setTimeout(res, time);
    });

async function retry(fn, maxAttempts, delay = 5000, maxDelay = 60000) {
    let attempts = 0;
    while (true) {
        try {
            console.log("Calling function");
            return await fn();
        } catch (error) {
            console.log("Failed to deploy, attempt number", error.toString(), attempts);
            attempts++;
            if (attempts >= maxAttempts) {
                console.log("Max Attempts reached");
                throw error;
            }
            let nextDelay = delay * Math.pow(2, attempts - 1);
            if (nextDelay > maxDelay) {
                nextDelay = maxDelay;
            }
            await new Promise((resolve) => setTimeout(resolve, nextDelay));
        }
    }
}

async function deployAndInitializeContract(deployer, contract, deployArgs, contractAddress) {
    if (!contractAddress) {
        await deployer.deploy(contract, ...deployArgs);
        deployedContract = await contract.deployed();
        contractAddress = deployedContract.address;
        console.log(`Deployed ${contract.contractName} at ${deployedContract.address}`);
    } else {
        deployedContract = await contract.at(contractAddress);
    }

    return deployedContract;
}

module.exports = async (deployer) => {
    return; //remove this when you want to deploy to mainnet
    const owner = "0xf7F211245B2bE47EC0449aA84a22e1d54708994A";
    let contributionAddress = undefined;
    let recordsVotingAddress = undefined;
    let recordsAddress = undefined;
    let tracksAddress = undefined;
    let crdTokenAddress = undefined;
    let treasuryAddress = undefined;
    let treasuryCoreAddress = undefined;
    let contributionVotingAddress = undefined;
    let ordersAddress = undefined;
    let agreementAddress = undefined;
    let dilutionAddress = undefined;
    let votingHubAddress = undefined;
    let crowdrecordsAddress = undefined;
    let controllerAddress = undefined;

    await retry(async function() {
        this.contributionContract = await deployAndInitializeContract(
            deployer,
            ContributionContract,
            [owner],
            contributionAddress
        );
    }, 1000);

    sleep(15000);
    await retry(async function() {
        this.recordsVotingContract = await deployAndInitializeContract(
            deployer,
            RecordsVotingContract,
            [owner],
            recordsVotingAddress
        );
    }, 1000);

    sleep(15000);
    await retry(async function() {
        this.recordsContract = await deployAndInitializeContract(
            deployer,
            RecordsContract,
            [owner, this.contributionContract.address, this.recordsVotingContract.address],
            recordsAddress
        );
    }, 1000);

    sleep(15000);
    await retry(async function() {
        this.tracksContract = await deployAndInitializeContract(
            deployer,
            TracksContract,
            [],
            tracksAddress
        );
    }, 1000);

    sleep(15000);
    await retry(async function() {
        this.crdTokenContract = await deployAndInitializeContract(
            deployer,
            CrdTokenContract,
            [owner],
            crdTokenAddress
        );
    }, 1000);

    sleep(15000);
    await retry(async function() {
        this.treasuryContract = await deployAndInitializeContract(
            deployer,
            TreasuryContract,
            [owner],
            treasuryAddress
        );
    }, 1000);

    sleep(15000);
    await retry(async function() {
        this.treasuryCoreContract = await deployAndInitializeContract(
            deployer,
            TreasuryCoreContract,
            [owner],
            treasuryCoreAddress
        );
    }, 1000);

    sleep(15000);
    await retry(async function() {
        this.contributionVotingContract = await deployAndInitializeContract(
            deployer,
            ContributionVotingContract,
            [VOTING_INTERVAL_BLOCKS, owner],
            contributionVotingAddress
        );
    }, 1000);

    sleep(15000);
    await retry(async function() {
        this.ordersContract = await deployAndInitializeContract(
            deployer,
            OrdersContract,
            [owner],
            ordersAddress
        );
    }, 1000);

    sleep(15000);
    await retry(async function() {
        this.agreementContract = await deployAndInitializeContract(
            deployer,
            AgreementContract,
            [VOTING_INTERVAL_BLOCKS, owner],
            agreementAddress
        );
    }, 1000);

    sleep(15000);
    await retry(async function() {
        this.dilutionContract = await deployAndInitializeContract(
            deployer,
            DilutionContract,
            [VOTING_INTERVAL_BLOCKS, DILUTION_REQUEST_INTERVAL, owner],
            dilutionAddress
        );
    }, 1000);

    sleep(15000);
    await retry(async function() {
        this.votingHubContract = await deployAndInitializeContract(
            deployer,
            VotingHubContract,
            [owner],
            votingHubAddress
        );
    }, 1000);

    sleep(15000);
    await retry(async function() {
        this.crowdrecordsGovernor = await deployAndInitializeContract(
            deployer,
            CrowdrecordsGovernor,
            [
                this.crdTokenContract.address,
                GOV_VOTING_DELAY,
                GOV_VOTING_PERIOD,
                GOV_VOTING_THRESHOLD,
            ],
            crowdrecordsAddress
        );
    }, 1000);

    sleep(15000);
    await retry(async function() {
        this.controllerContract = await deployAndInitializeContract(
            deployer,
            ControllerContract,
            [
                this.tracksContract.address,
                this.contributionContract.address,
                this.recordsContract.address,
                this.treasuryCoreContract.address,
            ],
            controllerAddress
        );
    }, 1000);

    try {
        await this.recordsVotingContract.initialize(
            this.recordsContract.address,
            this.treasuryContract.address,
            this.treasuryCoreContract.address,
            this.crowdrecordsGovernor.address
        );
    } catch (err) {
        console.log(err);
    }

    try {
        await this.contributionContract.initialize(
            this.contributionVotingContract.address,
            this.recordsContract.address,
            this.tracksContract.address,
            this.controllerContract.address
        );
    } catch (err) {
        console.log(err);
    }

    try {
        await this.contributionVotingContract.initialize(
            this.treasuryContract.address,
            this.contributionContract.address,
            this.crowdrecordsGovernor.address
        );
    } catch (err) {
        console.log(err);
    }

    try {
        await this.ordersContract.initialize(
            this.treasuryContract.address,
            this.treasuryCoreContract.address
        );
    } catch (err) {
        console.log(err);
    }

    try {
        await this.agreementContract.initialize(
            this.treasuryContract.address,
            this.treasuryCoreContract.address,
            this.crdTokenContract.address,
            this.crowdrecordsGovernor.address
        );
    } catch (err) {
        console.log(err);
    }

    try {
        await this.votingHubContract.setTreasuryCoreContractAddress(
            this.treasuryCoreContract.address
        );
    } catch (err) {
        console.log(err);
    }
    try {
        await this.votingHubContract.addVotingContract(this.contributionVotingContract.address);
    } catch (err) {
        console.log(err);
    }
    try {
        await this.votingHubContract.addVotingContract(this.agreementContract.address);
    } catch (err) {
        console.log(err);
    }
    try {
        await this.votingHubContract.addVotingContract(this.dilutionContract.address);
    } catch (err) {
        console.log(err);
    }
    try {
        await this.votingHubContract.addVotingContract(this.recordsVotingContract.address);
    } catch (err) {
        console.log(err);
    }

    try {
        await this.treasuryContract.initialize(
            this.treasuryCoreContract.address,
            this.recordsContract.address,
            this.recordsVotingContract.address,
            this.dilutionContract.address,
            this.contributionVotingContract.address
        );
    } catch (err) {
        console.log(err);
    }
    try {
        await this.treasuryContract.addSnapshotCaller(this.agreementContract.address);
    } catch (err) {
        console.log(err);
    }
    try {
        await this.treasuryContract.addSnapshotCaller(this.recordsVotingContract.address);
    } catch (err) {
        console.log(err);
    }

    try {
        await this.crdTokenContract.initialize(
            this.treasuryContract.address,
            this.treasuryCoreContract.address,
            this.agreementContract.address
        );
    } catch (err) {
        console.log(err);
    }

    try {
        await this.treasuryCoreContract.initialize(
            this.votingHubContract.address,
            this.treasuryContract.address,
            this.crdTokenContract.address,
            this.controllerContract.address
        );
    } catch (err) {
        console.log(err);
    }

    try {
        await this.dilutionContract.initialize(
            this.treasuryContract.address,
            this.crowdrecordsGovernor.address
        );
    } catch (err) {
        console.log(err);
    }

    try {
        await this.recordsContract.initialize(this.controllerContract.address);
    } catch (err) {
        console.log(err);
    }

    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ crowdrecordsGovernor:",
        this.crowdrecordsGovernor.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ dilutionContract:",
        this.dilutionContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ votingHubContract:",
        this.votingHubContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ agreementContract:",
        this.agreementContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ ordersContract:",
        this.ordersContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ contributionVotingContract:",
        this.contributionVotingContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ crdTokenContract:",
        this.crdTokenContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ treasuryCoreContract:",
        this.treasuryCoreContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ treasuryContract:",
        this.treasuryContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ recordsVotingContract:",
        this.recordsVotingContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ recordsContract:",
        this.recordsContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ contributionContract:",
        this.contributionContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ tracksContract:",
        this.tracksContract.address
    );
    console.log(
        "🚀 ~ file: 1_initial_migration.js:179 ~ module.exports= ~ controllerContract:",
        this.controllerContract.address
    );
};

