pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TracksContract {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

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

    mapping(uint256 => Tracks) public tracksData;

    constructor() {}

    /// @dev This function will be called by the user to create multiple tracks
    /// @param tracksPayload This is the payload that contains multiple data
    function createNewTracks(
        TrackPayload[] memory tracksPayload
    ) public returns (uint256[] memory) {
        uint256[] memory trackIds = new uint256[](tracksPayload.length);
        for (uint i = 0; i < tracksPayload.length; i++) {
            _tokenIds.increment();

            uint256 newTrackId = _tokenIds.current();
            Tracks memory track = Tracks({
                filehash: tracksPayload[i].filehash,
                filelink: tracksPayload[i].filelink,
                category: tracksPayload[i].category,
                creationDate: block.timestamp,
                owner: msg.sender
            });

            tracksData[newTrackId] = track;

            emit TrackCreated({
                filehash: tracksPayload[i].filehash,
                filelink: tracksPayload[i].filelink,
                category: tracksPayload[i].category,
                trackId: newTrackId,
                creationDate: track.creationDate,
                owner: msg.sender
            });
            trackIds[i] = newTrackId;
        }

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
