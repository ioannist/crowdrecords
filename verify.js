const exec = require("child_process").exec;

// List the contract names and their corresponding addresses
const contracts = [
    {
        name: "ContributionContract",
        address: "0x06D6DBE9d93ADB85523c1FDAe38229aA97953E15",
    },
    {
        name: "RecordsVotingContract",
        address: "0x95219Bf8124bE39aEa772447b7DF8A5F62a5D579",
    },
    {
        name: "RecordsContract",
        address: "0x88D3F1F3e1256BAbb7634A18a95D33F877036E64",
    },
    {
        name: "TracksContract",
        address: "0x369B67A677Eb936a8023ae490865517dC59b4f40",
    },
    {
        name: "CrdTokenContract",
        address: "0x805855957235CEa526108686df62433FB91040A2",
    },
    {
        name: "TreasuryContract",
        address: "0x887710D1446ECbfDb77E3Ea743C977807bb29e20",
    },
    {
        name: "TreasuryCoreContract",
        address: "0x54e7d56447b2e1099932B284DC046e6685791Ffd",
    },
    {
        name: "ContributionVotingContract",
        address: "0x68F01d4CC98f585849277EbeF6332b3443a208c9",
    },
    {
        name: "OrdersContract",
        address: "0xC6e28A465E19E8aD89c10f8a5430398f5a245e0B",
    },
    {
        name: "AgreementContract",
        address: "0xbeaFBe8D2774249996465B6Ef6DF877457602756",
    },
    {
        name: "DilutionContract",
        address: "0xFC8FaFda01387A31319F669C1552902a677c9F9f",
    },
    {
        name: "VotingHubContract",
        address: "0x2FB5A7fDb2C8d3C0b6F339B513AD5f70BA4B308C",
    },
    {
        name: "CrowdrecordsGovernor",
        address: "0xF5Bb04430d51401631CAdB30fCcAF3f0dcB0a6Cf",
    },
    {
        name: "ControllerContract",
        address: "0xc5C2daFE2f3BE1e903A190F75e73117a6F0703B7",
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

