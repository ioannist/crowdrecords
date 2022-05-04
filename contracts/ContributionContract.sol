pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./voting/ContributionVotingContract.sol";

contract ContributionContract is ERC721 {
    //----------------------Contribution Related code---------------------//

    using Counters for Counters.Counter;
    Counters.Counter private _contributionIds;
    address OWNER;
    address public CONTRIBUTION_VOTING_CONTRACT_ADDRESS;

    /**
        @dev this is Contribution Create event this event will be emited when a new contribution is created.
        @param contributionId it is the unique identifier for the contribution
        @param tracks are id of the tracks that are part of this contribution, you will have to manually fetch the tracks data from trackId once you do the indexing. 
        @param createdAt createdAt is indicates the time of creation of the contribution
        @param previewFile this is the file that contains the mix of the contribution also known as preview file
        @param previewFileHash this is the hash of the preview file to make sure the previewFile is not temperd with 
        @param recordId this is the id of the record to which the contribution belongd to
        @param seedContribution this flag determines if the contribution is a seed contribution or not
        @param roughMix this flag determines if the contribution is a new contribution, with new tracks or is it just mix of all the previous tracks
        @param status this is status of the contribution that is in PENDING or ACCEPTED or REJECTED // status (PENDING = 1 | ACCEPTED = 2| REJECTED = 3)
        @param description the description of record that is in text format 
     */
    event ContributionCreated(
        uint256 contributionId,
        uint256[] tracks,
        uint256 createdAt,
        string previewFile,
        string previewFileHash,
        uint256 recordId,
        bool seedContribution,
        bool roughMix,
        uint256 status,
        string description
    );

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
    }

    mapping(uint256 => Contribution) contributionData;

    constructor() ERC721("Contributions", "CTRB") {
        // _baseURIextended = baseURI_;
        OWNER = msg.sender;
    }

    /**
     * @dev Modifier to check that the person who accesses a specific function is the owner of contract himself.
     */
    modifier ownerOnly() {
        require(msg.sender == OWNER, "You are not authorized for this action");
        _;
    }

    /**
     * @dev This function sets the Voting Contract address
     */
    function setContributionVotingContractAddress(
        address newVotingContractAddress
    ) public ownerOnly {
        CONTRIBUTION_VOTING_CONTRACT_ADDRESS = newVotingContractAddress;
    }

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
    ) public returns (uint256) {
        _contributionIds.increment();

        uint256 contributionId = _contributionIds.current();
        _mint(msg.sender, contributionId);

        ContributionVotingContract contributionVotingContract = ContributionVotingContract(
                CONTRIBUTION_VOTING_CONTRACT_ADDRESS
            );
        contributionVotingContract.createContributionVotingBallot(
            contributionId,
            recordId,
            governanceReward,
            governanceTokenId,
            communityReward,
            communityTokenId
        );

        Contribution memory contribution = Contribution({
            tracks: tracks,
            createdAt: block.timestamp,
            previewFile: previewFile,
            previewFileHash: previewFileHash,
            recordId: recordId,
            roughMix: roughMix,
            status: 1,
            description: description,
            seedContribution: false
        });

        contributionData[contributionId] = contribution;

        emit ContributionCreated(
            contributionId,
            contribution.tracks,
            contribution.createdAt,
            contribution.previewFile,
            contribution.previewFileHash,
            contribution.recordId,
            contribution.seedContribution,
            contribution.roughMix,
            contribution.status,
            contribution.description
        );

        return contributionId;
    }

    /**
     * @dev This function will be called by the user to create a new seed contribution as there will be not voting or anything like that
     * @param tracks Id of tracks that are part of this contribution
     * @param previewFile this is preview file of the contribution
     * @param previewFileHash this is hash of the preview file
     * @param description this is the description of the new contriution that is created.
     */
    function createSeedContribution(
        // string memory uri,
        uint256[] memory tracks,
        string memory previewFile,
        string memory previewFileHash,
        string memory description
    ) public returns (uint256) {
        _contributionIds.increment();

        uint256 contributionId = _contributionIds.current();
        _mint(msg.sender, contributionId);

        bool seedContribution;

        Contribution memory contribution = Contribution({
            tracks: tracks,
            createdAt: block.timestamp,
            previewFile: previewFile,
            previewFileHash: previewFileHash,
            recordId: 0,
            roughMix: false,
            status: 2,
            description: description,
            seedContribution: true
        });

        contributionData[contributionId] = contribution;

        emit ContributionCreated(
            contributionId,
            contribution.tracks,
            contribution.createdAt,
            contribution.previewFile,
            contribution.previewFileHash,
            contribution.recordId,
            contribution.seedContribution,
            contribution.roughMix,
            contribution.status,
            contribution.description
        );

        return contributionId;
    }
}
