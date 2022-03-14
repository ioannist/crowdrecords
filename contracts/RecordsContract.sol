pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ERC 20 balance[adress] => 2 contracts // governance and comunity
// ERC 721 blance[adress] => 1 contract // records
// ERC 1155

contract RecordContract is ERC1155Supply {
    //----------------------Permanent Uri code---------------------//

    // Optional mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;

    mapping(uint256 => bool) private _permanentURI;

    function _setTokenURI(uint256 tokenId, string memory _tokenURI)
        internal
        virtual
    {
        require(
            exists(tokenId),
            "ERC721Metadata: URI set of nonexistent token"
        );

        require(
            _permanentURI[tokenId] != true,
            "ERC721Metadata: Metadata is not editable now"
        );

        _tokenURIs[tokenId] = _tokenURI;
    }

    function _lockTokenURI(uint256 tokenId) private {
        require(
            exists(tokenId),
            "ERC721Metadata: URI set of nonexistent token"
        );

        require(
            _permanentURI[tokenId] == false,
            "ERC721Metadata: Metadata is already set to not editable"
        );

        _permanentURI[tokenId] = true;
    }

    function _tokenURI(uint256 tokenId)
        public
        view
        virtual
        returns (string memory)
    {
        require(
            exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        return _tokenURIs[tokenId];
    }

    //----------------------Records Related code---------------------//

    uint256 public constant GOVERNANCE = 1;
    uint256 public constant COPYRIGHT = 2;
    uint256 public constant RECORDS = 3;
    uint256 newTokenId = 1;
    uint256 public constant CRD = 1;

    mapping(uint256 => uint256) tokenType;

    constructor() ERC1155("https://something.com/{id}") {
        _mint(
            msg.sender,
            CRD,
            10**18,
            "ipfs://crowd.com/sdsfdnsfn038r93gf7dasdasd"
        );
    }

    function getUri(uint256 id) public view returns (string memory) {
        return uri(id);
    }

    function sendTo(
        uint256 tokenId,
        uint256 amount,
        address reciver
    ) public {
        safeTransferFrom(msg.sender, reciver, tokenId, amount, "");
    }

    function exchangeTokens(
        uint256 senderTokenId,
        uint256 sendingAmount,
        uint256 recivingTokenId,
        uint256 recivingAmount,
        address reciver
    ) public {
        require(
            balanceOf(reciver, recivingTokenId) > recivingAmount,
            "insufficiant balance"
        );
        require(
            balanceOf(msg.sender, senderTokenId) > sendingAmount,
            "insufficiant balance"
        );

        safeTransferFrom(
            msg.sender,
            reciver,
            senderTokenId,
            sendingAmount,
            "0"
        );
        safeTransferFrom(
            reciver,
            msg.sender,
            recivingTokenId,
            recivingAmount,
            "0"
        );
    }

    function createNewRecord(
        uint256 govTokenSupply,
        uint256 communityTokenSupply,
        string memory govUri,
        string memory commUri,
        string memory recordUri
    )
        public
        returns (
            uint256 govToken,
            uint256 commToken,
            uint256 recordId
        )
    {
        uint256 govToken = newTokenId++;
        _mint(msg.sender, newTokenId, govTokenSupply * 10**9, "");
        _setTokenURI(newTokenId, govUri);
        _lockTokenURI(newTokenId);
        tokenType[newTokenId] = COPYRIGHT;

        uint256 commToken = newTokenId++;
        _mint(msg.sender, newTokenId, communityTokenSupply * 10**9, "");
        _setTokenURI(newTokenId, commUri);
        _lockTokenURI(newTokenId);
        tokenType[newTokenId] = GOVERNANCE;

        uint256 recordId = newTokenId++;
        _mint(msg.sender, newTokenId, 1, "");
        _setTokenURI(newTokenId, recordUri);
        _lockTokenURI(newTokenId);
        tokenType[newTokenId] = RECORDS;

        return (govToken, commToken, recordId);
    }
}
