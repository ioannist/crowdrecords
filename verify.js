const exec = require("child_process").exec;

// List the contract names and their corresponding addresses
const contracts = [
    {
        name: "ContributionContract",
        address: "0x4Da92c898b3396337Fd71A5A5e901a6d8f4a5929",
    },
    {
        name: "RecordsVotingContract",
        address: "0x996171246F379d5Db3E6406F489905316BB5C3F0",
    },
    {
        name: "RecordsContract",
        address: "0xD8EcB49424B49f32Dce7B4e8A7fc83E3Ab18cd9A",
    },
    {
        name: "TracksContract",
        address: "0x5E3a6992bb312E3c3ce508399C78a5b627C41C6b",
    },
    {
        name: "CrdTokenContract",
        address: "0x0B273c45567750aa9afF7E1C85C05B1aA9f85C13",
    },
    {
        name: "TreasuryContract",
        address: "0x82e9A20871339a4Ea87df826127db5d1f50B3ECd",
    },
    {
        name: "TreasuryCoreContract",
        address: "0xA535E7ECA76BF1dbdbED9d8745b9158632Dca0d7",
    },
    {
        name: "ContributionVotingContract",
        address: "0x351C5B7D1D27085ea38DeEdCF174C7429AfEB6fF",
    },
    {
        name: "OrdersContract",
        address: "0x44962548Df35ca445317807dbFdfc506f10E6d10",
    },
    {
        name: "AgreementContract",
        address: "0xDcCE68C4Ca62ee121a1159D76bEFFC739985B79e",
    },
    {
        name: "DilutionContract",
        address: "0x566d4F1f70E9b71137f9BdF4ec215BA42e52640C",
    },
    {
        name: "VotingHubContract",
        address: "0x5f012a247e6fEF13E6550A6c461f79E87eEA6300",
    },
    {
        name: "CrowdrecordsGovernor",
        address: "0x11Ea313301b18d1d458eEBf6A90762c7D99B3988",
    },
    {
        name: "ControllerContract",
        address: "0x18403e52D67Bc29aC1fB7281946b74868c209255",
    },
    // Add more contracts as needed
];

// Specify the network to verify on
const network = "moonbase";

// Loop through the contracts and verify them
contracts.forEach((contract) => {
    const command = `truffle run verify ${contract.name}@${contract.address} --network ${network}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error verifying ${contract.name}: ${error}`);
        } else {
            console.log(`Successfully verified ${contract.name}`);
        }
    });
});

