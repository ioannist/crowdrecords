const exec = require("child_process").exec;

// List the contract names and their corresponding addresses
const contracts = [
    {
        name: "ContributionContract",
        address: "0xF52e2EbE3E3Bf799211e7fB827F45541f40DCa86", // Not verified
    },
    {
        name: "RecordsVotingContract",
        address: "0x5C95aA2D2A34E70Df59a28813e8eCC3c8Ac4a96d", // Not verified
    },
    {
        name: "RecordsContract",
        address: "0xDF9e9B0262257D715f50868DA134Cf1d0581340B",
    },
    {
        name: "TracksContract",
        address: "0x31c145d8A2067E01ce7F71bBBa7C429c43ec156e",
    },
    {
        name: "CrdTokenContract",
        address: "0x3381B4dc82335DE2D4B2f7742F4CaDB0327BC8a1",
    },
    {
        name: "TreasuryContract",
        address: "0xd5282268990cDf92AC8A69A5B11546CC13721005", // Not verified
    },
    {
        name: "TreasuryCoreContract",
        address: "0x62267c1DBEBba9a75A2aC84b290473889c1Da360",
    },
    {
        name: "ContributionVotingContract",
        address: "0x49C055dd724b0E80573af6492704Eb1c441EB628",
    },
    {
        name: "OrdersContract",
        address: "0x930Ea7dd95fc35fE5C4Ca5D74308610E1B246D43",
    },
    {
        name: "AgreementContract",
        address: "0xd621ca94927B7af3b28C785792944Ee00CE87FCe",
    },
    {
        name: "DilutionContract",
        address: "0xEFbdF1f895d798139117546fE6E1F8E4A04Da758", // Not verified
    },
    {
        name: "VotingHubContract",
        address: "0x4346031b3551FE1708E46cD2A1C5E1B33d584709",
    },
    {
        name: "CrowdrecordsGovernor",
        address: "0x5295697c4E108F9Eaf10cDbA084c22382A7aa73C",
    },
    {
        name: "ControllerContract",
        address: "0x13f397363278CB639aAE73559e662b8ac480B05b", // Not verified
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

