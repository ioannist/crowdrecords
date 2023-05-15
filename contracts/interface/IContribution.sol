pragma solidity ^0.8.0;

interface IContribution {
    /// @dev This structure will store information of the contribution
    /// @param tracks Array of id of tracks
    /// @param title title of the contribution
    /// @param createdAt blocknumber of when the contribution was created
    /// @param previewFile This is the preview file link
    /// @param previewFileHash This is the preview file hash
    /// @param seedContribution This flag determines if it is a seed contribution or not
    /// @param roughMix This flag determines if it is a rough mix or not, true if rough mix or else false
    /// @param status This specifies the status of contribution PENDING = 1 | ACCEPTED = 2| REJECTED = 3
    /// @param description This is the description that is entered by user
    /// @param owner This is the owner of the contribution
    /// @param isPresent This is to check if a contribution exists or not
    struct Contribution {
        uint256[] tracks;
        string title;
        uint256 createdAt;
        string previewFile;
        string previewFileHash;
        bool seedContribution;
        bool roughMix;
        uint256 status;
        string description;
        address owner;
        bool isPresent;
    }

    struct SeedContributionPayload {
        uint256[] tracks;
        string title;
        string previewFile;
        string previewFileHash;
        string description;
    }

    struct NewContributionPayload {
        uint256[] tracks;
        string title;
        string previewFile;
        string previewFileHash;
        uint256 recordId;
        bool roughMix;
        string description;
        uint256 communityReward;
        uint256 governanceReward;
    }

    /// @dev This function sets the Voting Contract address
    /// @param newVotingContractAddress this is the address of new voting contract
    function setContributionVotingContractAddress(
        address newVotingContractAddress
    ) external;

    /// @dev This function will be called by the user to create a new contribution
    /// @param payload this is the data required for creation of new contribution
    /// @param platformWallet this is the UI providers wallet
    /// @param platformFee this is the incentive amount for the UI maintainer
    function createNewContribution(
        NewContributionPayload memory payload,
        address payable platformWallet,
        uint256 platformFee
    ) external returns (uint256);

    /// @dev This function will be called by the user to create a new seed contribution as there will be not voting
    /// or anything like that
    /// @param payload data for the seed contribution creation
    /// @param platformWallet this is the UI providers wallet
    /// @param platformFee this is the incentive amount for the UI maintainer
    function createSeedContribution(
        SeedContributionPayload memory payload,
        address payable platformWallet,
        uint256 platformFee
    ) external payable returns (uint256);

    /// @dev This function is to be called only by the controller contract that is created to bundle multiple contract calls into single function
    /// @param payload data for the seed contribution creation
    /// @param owner address of the owner of the seed contribution
    function controllerCreateSeedContribution(
        SeedContributionPayload memory payload,
        address owner
    ) external returns (uint256);

    /// @dev This function returns contribution data
    /// @param contributionId Id of the contribution whose data you want
    function getContributionData(
        uint256 contributionId
    ) external view returns (Contribution memory contribution);
}
