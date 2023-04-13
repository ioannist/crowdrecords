pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./voting/ContributionVotingContract.sol";
import "./interface/IRecords.sol";
import "./interface/ITracks.sol";

contract ContributionContract is Initializable {
    using Counters for Counters.Counter;

    /// @dev this is Contribution Create event this event will be emitted when a new contribution is created.
    /// @param contributionId it is the unique identifier for the contribution
    /// @param tracks are id of the tracks that are part of this contribution, you will have to manually fetch the
    /// tracks data from trackId once you do the indexing.
    /// @param title title of the contribution
    /// @param createdAt createdAt is indicates the time of creation of the contribution
    /// @param previewFile this is the file that contains the mix of the contribution also known as preview file
    /// @param previewFileHash this is the hash of the preview file to make sure the previewFile is not tampered with
    /// @param recordId this is the id of the record to which the contribution belong to
    /// @param seedContribution this flag determines if the contribution is a seed contribution or not
    /// @param roughMix this flag determines if the contribution is a new contribution, with new tracks or is it just mix
    /// of all the previous tracks
    /// @param status this is status of the contribution that is (PENDING = 1 | ACCEPTED = 2| REJECTED = 3)
    /// @param description the description of record that is in text format
    event ContributionCreated(
        uint256 contributionId,
        uint256[] tracks,
        string title,
        uint256 createdAt,
        string previewFile,
        string previewFileHash,
        uint256 recordId,
        bool seedContribution,
        bool roughMix,
        uint256 status,
        string description
    );

    /// @dev This structure will store information of the contribution
    /// @param tracks Array of id of tracks
    /// @param title title of the contribution
    /// @param createdAt blocknumber of when the contribution was created
    /// @param previewFile This is the preview file link
    /// @param previewFileHash This is the preview file hash
    // / @param recordId This is the id of the record to which contribution belongs to
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

    Counters.Counter private _contributionIds;
    address public OWNER;
    address public CONTRIBUTION_VOTING_CONTRACT_ADDRESS;
    address public RECORD_CONTRACT_ADDRESS;
    IRecords public recordsContract;
    address public TRACKS_CONTRACT_ADDRESS;
    ITracks public trackInterface;
    mapping(uint256 => Contribution) public contributionData;
    uint256 public PENDING = 1;
    uint256 public ACCEPTED = 2;
    uint256 public REJECTED = 3;

    constructor(address owner) {
        OWNER = owner;
    }

    /// @dev Modifier to check that the person who accesses a specific function is the owner of contract himself.
    modifier ownerOnly() {
        require(msg.sender == OWNER, "UNAUTHORIZED: CANNOT_PERFORM_ACTION");
        _;
    }

    /// @dev This is to set the address of the contracts
    /// @param newVotingContractAddress this is the address of new voting contract
    /// @param newRecordsContractAddress this is the address of new Records contract
    /// @param newTracksContractAddress this is the address of new tracks contract
    function initialize(
        address newVotingContractAddress,
        address newRecordsContractAddress,
        address newTracksContractAddress
    ) public initializer ownerOnly {
        CONTRIBUTION_VOTING_CONTRACT_ADDRESS = newVotingContractAddress;
        RECORD_CONTRACT_ADDRESS = newRecordsContractAddress;
        recordsContract = IRecords(RECORD_CONTRACT_ADDRESS);
        TRACKS_CONTRACT_ADDRESS = newTracksContractAddress;
        trackInterface = ITracks(TRACKS_CONTRACT_ADDRESS);
    }

    /// @dev This function sets the owner address
    /// @param ownerAddress This is the address of the owner
    function setOwnerAddress(address ownerAddress) public ownerOnly {
        OWNER = ownerAddress;
    }

    /// @dev This function returns contribution data
    /// @param contributionId Id of the contribution whose data you want
    function getContributionData(
        uint256 contributionId
    ) public view returns (Contribution memory contribution) {
        return contributionData[contributionId];
    }

    /// @dev This function will be called by the user to create a new contribution
    /// @param tracks Id of tracks that are part of this contribution
    /// @param title title of the contribution
    /// @param previewFile this is preview file of the contribution
    /// @param previewFileHash this is hash of the preview file
    /// @param recordId this is the id of the record to which contribution belongs to.
    /// @param roughMix this represents if a contribution is a roughMix or is a new contribution
    /// @param description this is the description of the new contribution that is created.
    /// @param communityReward this is the amount of community token that the contributor is requesting
    /// for his work contribution.
    /// @param governanceReward this is the amount of governance token that the contributor is requesting for his
    /// work contribution.
    function createNewContribution(
        // string memory uri,
        uint256[] memory tracks,
        string memory title,
        string memory previewFile,
        string memory previewFileHash,
        uint256 recordId,
        bool roughMix,
        string memory description,
        uint256 communityReward,
        uint256 governanceReward
    ) public payable returns (uint256) {
        _contributionIds.increment();
        {
            bool ownerStatus = trackInterface.checkOwner(tracks, msg.sender);

            require(ownerStatus, "INVALID: NOT_A_TRACK_OWNER");
        }

        uint256 contributionId = _contributionIds.current();
        // _mint(msg.sender, contributionId);

        ContributionVotingContract contributionVotingContract = ContributionVotingContract(
                CONTRIBUTION_VOTING_CONTRACT_ADDRESS
            );
        contributionVotingContract.createContributionVotingBallot{
            value: msg.value
        }(contributionId, recordId, governanceReward, communityReward);

        Contribution memory contribution = Contribution({
            tracks: tracks,
            title: title,
            createdAt: block.timestamp,
            previewFile: previewFile,
            previewFileHash: previewFileHash,
            roughMix: roughMix,
            status: PENDING,
            description: description,
            seedContribution: false,
            owner: msg.sender,
            isPresent: true
        });

        recordsContract.pushContributionIdToContributionList(
            recordId,
            contributionId
        );

        contributionData[contributionId] = contribution;

        emitContributionCreated(contributionId, contribution, recordId);

        return contributionId;
    }

    /// @dev This function will be called by the user to create a new seed contribution as there will be not voting
    /// or anything like that
    /// @param tracks Id of tracks that are part of this contribution
    /// @param previewFile this is preview file of the contribution
    /// @param previewFileHash this is hash of the preview file
    /// @param description this is the description of the new contribution that is created.
    function createSeedContribution(
        // string memory uri,
        uint256[] memory tracks,
        string memory title,
        string memory previewFile,
        string memory previewFileHash,
        string memory description
    ) public returns (uint256) {
        {
            bool ownerStatus = trackInterface.checkOwner(tracks, msg.sender);

            require(ownerStatus, "INVALID: NOT_A_TRACK_OWNER");
        }

        _contributionIds.increment();

        uint256 contributionId = _contributionIds.current();
        // _mint(msg.sender, contributionId);

        Contribution memory contribution = Contribution({
            tracks: tracks,
            title: title,
            createdAt: block.timestamp,
            previewFile: previewFile,
            previewFileHash: previewFileHash,
            roughMix: false,
            status: ACCEPTED,
            description: description,
            seedContribution: true,
            owner: msg.sender,
            isPresent: true
        });

        contributionData[contributionId] = contribution;

        emitContributionCreated(contributionId, contribution, 0);

        return contributionId;
    }

    function emitContributionCreated(
        uint256 contributionId,
        Contribution memory contribution,
        uint256 recordId
    ) internal {
        emit ContributionCreated(
            contributionId,
            contribution.tracks,
            contribution.title,
            contribution.createdAt,
            contribution.previewFile,
            contribution.previewFileHash,
            recordId,
            contribution.seedContribution,
            contribution.roughMix,
            contribution.status,
            contribution.description
        );
    }
}
