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
    let contributionAddress = "0xA0d4dA1f247180607cb157868482f3C6Bf4f7668";
    let recordsVotingAddress = "0x20132D03F6d40B7f031B91866297c2363FE87Ada";
    let recordsAddress = "0x38b23d433f62DB2fE32054C6224Fde36c32E6Ccd";
    let tracksAddress = "0xFD41Ab7f08ED35F04d98cE8dc389AF947e93747F";
    let crdTokenAddress = "0xA2300E7f2f396152DD8C928bc178DC66f283ebb7";
    let treasuryAddress = "0x5a4a35168e4a0Bf2C450F6a8A564cE222DB26060";
    let treasuryCoreAddress = "0x01B8dE8d1cC3f8ba05aF6d3E08f4383D4509A467";
    let contributionVotingAddress = "0xa4A415B0279bbCe250d99C1034b6C15D8fE3c05B";
    let ordersAddress = "0x32Fb09Ff9824D18259Ceaa7022C5097Dc7d6fee2";
    let agreementAddress = "0x96D9aF186134D431534007d33e53d943002fB218";
    let dilutionAddress = "0xD263Bc5e63B9a710c7844523794b8b68488444E7";
    let votingHubAddress = "0x146D45cf1114b4D9cB7570181Adf6DF9a3C5f743";
    let crowdrecordsAddress = "0x1FE59CD05DC746470F67891C8092a35483dD8a3f";
    let controllerAddress = "0x2F836bb1AA6E16d83D4cf158BB9c1655ec899292";

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
        console.log("initializing recordsVotingContract");
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
        console.log("initializing contributionContract");
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
        console.log("initializing contributionVotingContract");
        await this.contributionVotingContract.initialize(
            this.treasuryContract.address,
            this.contributionContract.address,
            this.crowdrecordsGovernor.address
        );
    } catch (err) {
        console.log(err);
    }

    try {
        console.log("initializing ordersContract");
        await this.ordersContract.initialize(
            this.treasuryContract.address,
            this.treasuryCoreContract.address
        );
    } catch (err) {
        console.log(err);
    }

    try {
        console.log("initializing agreementContract");
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
        console.log("initializing votingHubContract");
        await this.votingHubContract.setTreasuryCoreContractAddress(
            this.treasuryCoreContract.address
        );
    } catch (err) {
        console.log(err);
    }
    try {
        console.log("addVotingContract for contributionVotingContract");
        await this.votingHubContract.addVotingContract(this.contributionVotingContract.address);
    } catch (err) {
        console.log(err);
    }
    try {
        console.log("addVotingContract for agreementContract");
        await this.votingHubContract.addVotingContract(this.agreementContract.address);
    } catch (err) {
        console.log(err);
    }
    try {
        console.log("addVotingContract for dilutionContract");
        await this.votingHubContract.addVotingContract(this.dilutionContract.address);
    } catch (err) {
        console.log(err);
    }
    try {
        console.log("addVotingContract for recordsVotingContract");
        await this.votingHubContract.addVotingContract(this.recordsVotingContract.address);
    } catch (err) {
        console.log(err);
    }

    try {
        console.log("initializing treasuryContract");
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
        console.log("addSnapshotCaller for agreementContract");
        await this.treasuryContract.addSnapshotCaller(this.agreementContract.address);
    } catch (err) {
        console.log(err);
    }
    try {
        console.log("addSnapshotCaller for recordsVotingContract");
        await this.treasuryContract.addSnapshotCaller(this.recordsVotingContract.address);
    } catch (err) {
        console.log(err);
    }

    try {
        console.log("initializing crdTokenContract");
        await this.crdTokenContract.initialize(
            this.treasuryContract.address,
            this.treasuryCoreContract.address,
            this.agreementContract.address
        );
    } catch (err) {
        console.log(err);
    }

    try {
        console.log("initializing treasuryCoreContract");
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
        console.log("initializing dilutionContract");
        await this.dilutionContract.initialize(
            this.treasuryContract.address,
            this.treasuryCoreContract.address,
            this.crowdrecordsGovernor.address
        );
    } catch (err) {
        console.log(err);
    }

    try {
        console.log("initializing recordsContract");
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

