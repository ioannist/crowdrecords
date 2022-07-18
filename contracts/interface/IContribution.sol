pragma solidity ^0.8.0;

interface IContribution {
    struct Contribution {
        uint256[] tracks;
        uint256 createdAt;
        string previewFile;
        string previewFileHash;
        uint256 recordId;
        bool seedContribution;
        bool roughMix; // true if rough mix or else false
        uint256 status; // status (PENDING = 1 | ACCEPTED = 2| REJECTED = 3)
        string description;
        bool isPresent;
    }

    /**
     * @dev This function sets the Voting Contract address
     */
    function setContributionVotingContractAddress(
        address newVotingContractAddress
    ) external;

    /**
     * @dev This function will be called by the user to create a new contribution
     * @param tracks Id of tracks that are part of this contribution
     * @param previewFile this is preview file of the contribution
     * @param previewFileHash this is hash of the preview file
     * @param recordId this is the id of the record to which contribution belongs to.
     * @param roughMix this represents if a contribution is a roughMix or is a new contribution
     * @param description this is the description of the new contriution that is created.
     * @param communityReward this is the amount of community token that the contributor is requesting for his work contribution.
     * @param governanceReward this is the amount of governance token that the contributor is requesting for his work contribution.
     */
    function createNewContribution(
        // string memory uri,
        uint256[] memory tracks,
        string memory previewFile,
        string memory previewFileHash,
        uint256 recordId,
        bool roughMix,
        string memory description,
        uint256 communityReward,
        uint256 communityTokenId,
        uint256 governanceReward,
        uint256 governanceTokenId
    ) external returns (uint256);

    /**
     * @dev This function will be called by the user to create a new seed contribution as there will be not voting or anything like that
     * @param tracks Id of tracks that are part of this contribution
     * @param previewFile this is preview file of the contribution
     * @param previewFileHash this is hash of the preview file
     * @param description this is the description of the new contriution that is created.
     */
    function createSeedContribution(
        uint256[] memory tracks,
        string memory previewFile,
        string memory previewFileHash,
        string memory description
    ) external returns (uint256);

    /**
     * @dev This function returns contribution data
     * @param contributionId Id of the contribution whose data you want
     */
    function getContributionData(uint256 contributionId)
        external
        view
        returns (Contribution memory contribution);
}
