pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TracksContract is ERC721 {
    //----------------------Tracks Related code---------------------//
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Tracks {
        string filehash;
        string filelink;
        string category;
        uint256 creationDate;
    }

    /**
     * @dev This is emited when a new track is created
     * @param trackId This is the id of the track
     * @param filehash This is hash of the file
     * @param filelink This is the link to the file
     * @param category this is hash of the preview file
     * @param creationDate this is hash of the preview file
     */
    event TrackCreated(
        uint256 trackId,
        string filehash,
        string filelink,
        string category,
        uint256 creationDate
    );

    //Keep the baseURI empty if you want to have different URIs without any structure
    constructor() ERC721("Tracks", "CRD_TRKS") {
        // _baseURIextended = baseURI_;
    }

    /**
     * @dev This function will be called by the user to create a new contribution
     * @param filehash Id of tracks that are part of this contribution
     * @param filelink this is preview file of the contribution
     * @param category this is hash of the preview file
     */
    function createNewTrack(
        string memory filehash,
        string memory filelink,
        string memory category
    ) public returns (uint256) {
        _tokenIds.increment();

        uint256 newTrackId = _tokenIds.current();
        _mint(msg.sender, newTrackId);
        Tracks memory track = Tracks({
            filehash: filehash,
            filelink: filelink,
            category: category,
            creationDate: block.timestamp
        });

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
