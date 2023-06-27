pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TracksContract is Initializable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address public CONTROLLER_CONTRACT_ADDRESS;
    address public OWNER;

    /// @dev This holds data of individual tracks
    /// @param filehash This is hash of the file
    /// @param filelink This is the link to the file
    /// @param category this is the category of song
    /// @param creationDate this is hash of the preview file
    /// @param owner this is owner of the track
    struct Tracks {
        string filehash;
        string filelink;
        string category;
        uint256 creationDate;
        address owner;
    }

    /// @dev This is the payload for the Tracks creation
    /// @param filehash This is hash of the file
    /// @param filelink This is the link to the file
    /// @param category this is the category of song
    struct TrackPayload {
        string filehash;
        string filelink;
        string category;
    }

    /// @dev This is emited when a new track is created
    /// @param trackId This is the id of the track
    /// @param filehash This is hash of the file
    /// @param filelink This is the link to the file
    /// @param category this is the category of song
    /// @param creationDate this is hash of the preview file
    /// @param owner this is the owner of the track
    event TrackCreated(
        uint256 trackId,
        string filehash,
        string filelink,
        string category,
        uint256 creationDate,
        address owner
    );

    /// @dev This is emited when a new track is created
    /// @param trackIds This is the id of the track
    /// @param trackData This is the data for the tracks creation
    /// @param owner This is the owner of the tracks
    event TracksCreated(
        uint256[] trackIds,
        TrackPayload[] trackData,
        address owner
    );

    mapping(uint256 => Tracks) public tracksData;

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
    /// @param controllerContractAddress this is the address of controller contract
    function initialize(
        address controllerContractAddress
    ) public initializer ownerOnly {
        CONTROLLER_CONTRACT_ADDRESS = controllerContractAddress;
    }

    /// @dev This function will create tracks but it would only be called from controller
    /// @param tracksPayload This is the payload that contains multiple data
    /// @param owner This is the owner of the tracks
    function controllerCreateNewTracks(
        TrackPayload[] calldata tracksPayload,
        address owner
    ) public controllerContractOnly returns (uint256[] memory) {
        return _createNewTracks(tracksPayload, owner);
    }

    /// @dev This function will be called by the user to create multiple tracks
    /// @param tracksPayload This is the payload that contains multiple data
    function createNewTracks(
        TrackPayload[] calldata tracksPayload
    ) public returns (uint256[] memory) {
        return _createNewTracks(tracksPayload, msg.sender);
    }

    /// @dev This function will be called by the user to create multiple tracks
    /// @param tracksPayload This is the payload that contains multiple data
    /// @param owner This is the owner of the tracks
    function _createNewTracks(
        TrackPayload[] calldata tracksPayload,
        address owner
    ) internal returns (uint256[] memory) {
        require(tracksPayload.length > 0, "No payload");
        uint256 length = tracksPayload.length;
        uint256[] memory trackIds = new uint256[](length);

        for (uint i = 0; i < length; ) {
            _tokenIds.increment();
            trackIds[i] = _tokenIds.current();
            Tracks memory track = Tracks({
                filehash: tracksPayload[i].filehash,
                filelink: tracksPayload[i].filelink,
                category: tracksPayload[i].category,
                creationDate: block.timestamp,
                owner: owner
            });

            // emit TrackCreated({
            //     filehash: tracksPayload[i].filehash,
            //     filelink: tracksPayload[i].filelink,
            //     category: tracksPayload[i].category,
            //     trackId: trackIds[i],
            //     creationDate: track.creationDate,
            //     owner: owner
            // });

            tracksData[trackIds[i]] = track;
            unchecked {
                ++i;
            }
        }

        emit TracksCreated(trackIds, tracksPayload, owner);

        return trackIds;
    }

    /// @dev This function checks if all the tracks are owned by the single user
    /// @param tracks List of tracks Id which needs to be checked for the ownership
    /// @param owner This is the address of the owner
    /// @return status It returns true
    function checkOwner(
        uint256[] memory tracks,
        address owner
    ) public view returns (bool) {
        require(tracks.length > 0, "Tracks size should be at least 1");
        for (uint256 i = 0; i < tracks.length; i++) {
            if (tracksData[tracks[i]].owner != owner) {
                return false;
            }
        }
        return true;
    }
}
