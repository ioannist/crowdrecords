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
    struct Tracks {
        string filehash;
        string filelink;
        string category;
        uint256 creationDate;
    }

    /// @dev This is emited when a new track is created
    /// @param trackId This is the id of the track
    /// @param filehash This is hash of the file
    /// @param filelink This is the link to the file
    /// @param category this is the category of song
    /// @param creationDate this is hash of the preview file
    event TrackCreated(
        uint256 trackId,
        string filehash,
        string filelink,
        string category,
        uint256 creationDate
    );

    mapping(uint256 => Tracks) public tracksData;

    constructor() {}

    /// @dev This function will be called by the user to create a new contribution
    /// @param filehash This is hash of the file
    /// @param filelink this is preview file of the contribution
    /// @param category this is the category of song
    function createNewTrack(
        string memory filehash,
        string memory filelink,
        string memory category
    ) public returns (uint256) {
        _tokenIds.increment();

        uint256 newTrackId = _tokenIds.current();
        Tracks memory track = Tracks({
            filehash: filehash,
            filelink: filelink,
            category: category,
            creationDate: block.timestamp
        });

        tracksData[newTrackId] = track;

        emit TrackCreated({
            filehash: filehash,
            filelink: filelink,
            category: category,
            trackId: newTrackId,
            creationDate: track.creationDate
        });

        return newTrackId;
    }
}
