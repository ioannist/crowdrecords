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
    /// @param owner the owner of the contribution
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
        string description,
        address owner
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

    /// @param tracks Id of tracks that are part of this contribution
    /// @param title it is the title of the contribution
    /// @param previewFile this is preview file of the contribution
    /// @param previewFileHash this is hash of the preview file
    /// @param description this is the description of the new contribution that is created.
    struct SeedContributionPayload {
        uint256[] tracks;
        string title;
        string previewFile;
        string previewFileHash;
        string description;
    }

    Counters.Counter private _contributionIds;
    address public OWNER;
    address public CONTRIBUTION_VOTING_CONTRACT_ADDRESS;
    ContributionVotingContract contributionVotingContract;
    address public RECORD_CONTRACT_ADDRESS;
    IRecords public recordsContract;
    address public TRACKS_CONTRACT_ADDRESS;
    ITracks public trackInterface;
    address public CONTROLLER_CONTRACT_ADDRESS;
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

    /// @dev Modifier to restrict the function call from controller contract
    modifier controllerContractOnly() {
        require(
            msg.sender == CONTROLLER_CONTRACT_ADDRESS,
            "UNAUTHORIZED: CANNOT_PERFORM_ACTION"
        );
        _;
    }

    /// @dev This is to set the address of the contracts
    /// @param newVotingContractAddress this is the address of new voting contract
    /// @param newRecordsContractAddress this is the address of new Records contract
    /// @param newTracksContractAddress this is the address of new tracks contract
    /// @param controllerContractAddress this is the address of controller contract
    function initialize(
        address newVotingContractAddress,
        address newRecordsContractAddress,
        address newTracksContractAddress,
        address controllerContractAddress
    ) public initializer ownerOnly {
        CONTRIBUTION_VOTING_CONTRACT_ADDRESS = newVotingContractAddress;
        contributionVotingContract = ContributionVotingContract(
            CONTRIBUTION_VOTING_CONTRACT_ADDRESS
        );
        RECORD_CONTRACT_ADDRESS = newRecordsContractAddress;
        recordsContract = IRecords(RECORD_CONTRACT_ADDRESS);
        TRACKS_CONTRACT_ADDRESS = newTracksContractAddress;
        trackInterface = ITracks(TRACKS_CONTRACT_ADDRESS);
        CONTROLLER_CONTRACT_ADDRESS = controllerContractAddress;
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
    /// @param payload this is the data required for creation of new contribution
    /// @param platformWallet this is the UI providers wallet
    /// @param platformFee this is the incentive amount for the UI maintainer
    function createNewContribution(
        NewContributionPayload memory payload,
        address payable platformWallet,
        uint256 platformFee
    ) public payable returns (uint256) {
        {
            require(msg.value >= platformFee, "INV: INSUFFICIENT_PLATFORM_FEE");
            if (msg.value > 0) {
                platformWallet.call{value: platformFee}("");
            }

            bool ownerStatus = trackInterface.checkOwner(
                payload.tracks,
                msg.sender
            );

            require(ownerStatus, "INVALID: NOT_A_TRACK_OWNER");
        }

        return
            createContributionAndVoting(
                payload,
                msg.sender,
                msg.value - platformFee
            );
    }

    /// @dev This function will be called by the controller contract to create a new contribution and voting
    /// @param payload this is the data required for creation of new contribution
    /// @param owner this is the owner of the new contribution which is to be created
    function controllerCreateNewContribution(
        NewContributionPayload memory payload,
        address owner
    ) public payable controllerContractOnly returns (uint256) {
        return createContributionAndVoting(payload, owner, msg.value);
    }

    /// @dev This function is responsible to create a non seed contribution and to create voting for contribution
    /// @param payload this is the data required for creation of new contribution
    /// @param owner this is the owner of the contribution
    /// @param depositAmount this is the deposit amount for voting creation
    function createContributionAndVoting(
        NewContributionPayload memory payload,
        address owner,
        uint256 depositAmount
    ) internal returns (uint256) {
        uint256 contributionId = _createContribution(
            payload.tracks,
            payload.title,
            payload.previewFile,
            payload.previewFileHash,
            payload.description,
            payload.roughMix,
            PENDING,
            false,
            owner,
            payload.recordId
        );

        {
            contributionVotingContract.createContributionVotingBallot{
                value: depositAmount
            }(
                contributionId,
                payload.recordId,
                payload.governanceReward,
                payload.communityReward
            );

            recordsContract.pushContributionIdToContributionList(
                payload.recordId,
                contributionId
            );
        }
        return contributionId;
    }

    /// @dev This function will be called by the user to create a new seed contribution as there will be not voting
    /// or anything like that
    /// @param payload data for the seed contribution creation
    /// @param platformWallet this is the UI providers wallet
    /// @param platformFee this is the incentive amount for the UI maintainer
    function createSeedContribution(
        SeedContributionPayload memory payload,
        address payable platformWallet,
        uint256 platformFee
    ) public payable returns (uint256) {
        {
            require(msg.value >= platformFee, "INV: INSUFFICIENT_PLATFORM_FEE");
            if (msg.value > 0) {
                platformWallet.call{value: platformFee}("");
            }

            bool ownerStatus = trackInterface.checkOwner(
                payload.tracks,
                msg.sender
            );

            require(ownerStatus, "INVALID: NOT_A_TRACK_OWNER");
        }

        return
            _createContribution(
                payload.tracks,
                payload.title,
                payload.previewFile,
                payload.previewFileHash,
                payload.description,
                false,
                ACCEPTED,
                true,
                msg.sender,
                0
            );
    }

    /// @dev This function is to be called only by the controller contract that is created to bundle multiple contract calls into single function
    /// @param payload data for the seed contribution creation
    /// @param owner address of the owner of the seed contribution
    function controllerCreateSeedContribution(
        SeedContributionPayload memory payload,
        address owner
    ) public controllerContractOnly returns (uint256) {
        return
            _createContribution(
                payload.tracks,
                payload.title,
                payload.previewFile,
                payload.previewFileHash,
                payload.description,
                false,
                ACCEPTED,
                true,
                owner,
                0
            );
    }

    /// @dev This function is an internal function that creates the contribution
    /// @param tracks Id of tracks that are part of this contribution
    /// @param previewFile this is preview file of the contribution
    /// @param previewFileHash this is hash of the preview file
    /// @param description this is the description of the new contribution that is created.
    /// @param roughMix this flag denotes if the contribution is a rough mix or a new contributions
    /// @param status this is the status of the contribution
    /// @param isSeed this denotes if it is seed contribution or not
    /// @param owner this is the owner address
    /// @param recordId this is the record id to which the contribution belongs
    function _createContribution(
        uint256[] memory tracks,
        string memory title,
        string memory previewFile,
        string memory previewFileHash,
        string memory description,
        bool roughMix,
        uint status,
        bool isSeed,
        address owner,
        uint recordId
    ) internal returns (uint256) {
        _contributionIds.increment();

        uint256 contributionId = _contributionIds.current();

        Contribution memory contribution = Contribution({
            tracks: tracks,
            title: title,
            createdAt: block.timestamp,
            previewFile: previewFile,
            previewFileHash: previewFileHash,
            roughMix: roughMix,
            status: status,
            description: description,
            seedContribution: isSeed,
            owner: owner,
            isPresent: true
        });

        contributionData[contributionId] = contribution;

        emitContributionCreated(contributionId, contribution, recordId);

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
            contribution.description,
            contribution.owner
        );
    }
}
