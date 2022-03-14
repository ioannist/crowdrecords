pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ContributionContract is ERC721 {
    //----------------------Permanent Uri code---------------------//
    using Strings for uint256;

    // Optional mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;

    mapping(uint256 => bool) private _permanentURI;

    // Base URI
    string private _baseURIextended;

    function _setContirbutionURI(uint256 tokenId, string memory _tokenURI)
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

    function _lockContributionURI(uint256 tokenId) public virtual {
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

    function _contributionURI(uint256 tokenId)
        public
        view
        virtual
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

    //----------------------Contribution Related code---------------------//

    using Counters for Counters.Counter;
    Counters.Counter private _contributionIds;

    //Keep the baseURI empty if you want to have different URIs without any structure
    constructor(string memory baseURI_) ERC721("Contributions", "CTRB") {
        _baseURIextended = baseURI_;
    }

    /**
        Uri should contain all the data for the track such as : 
            tracks
            createdAt
            previewFile
            recordId //seed record will have no recordId
            roughMix (Boolean)
            communityTokenReward
            governanceTokenReward
            status (PENDING | ACCEPTED | REJECTED)
            description
    */
    function createNewContribution(string memory uri) public returns (uint256) {
        _contributionIds.increment();

        uint256 newItemId = _contributionIds.current();
        _mint(msg.sender, newItemId);
        _setContirbutionURI(newItemId, uri);
        _lockContributionURI(newItemId);
        return newItemId;
    }
}
