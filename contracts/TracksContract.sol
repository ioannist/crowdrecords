pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TracksContract is ERC721 {
    //----------------------Permanent Uri code---------------------//
    /*     using Strings for uint256;

    // Optional mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;

    mapping(uint256 => bool) private _permanentURI;

    // Base URI
    string private _baseURIextended;

    function _setTokenURI(uint256 tokenId, string memory _tokenURI)
        internal
        virtual
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI set of nonexistent token"
        );

        require(
            _permanentURI[tokenId] != true,
            "ERC721Metadata: Metadata is not editable now"
        );

        _tokenURIs[tokenId] = _tokenURI;
    }

    function _lockTokenURI(uint256 tokenId) public virtual {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI set of nonexistent token"
        );

        require(
            _permanentURI[tokenId] == false,
            "ERC721Metadata: Metadata is already set to not editable"
        );

        _permanentURI[tokenId] = true;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseURIextended;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }
        // If there is a baseURI but no tokenURI, concatenate the tokenID to the baseURI.
        return string(abi.encodePacked(base, tokenId.toString()));
    }
 */
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
