pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ERC 20 balance[adress] => 2 contracts // governance and comunity
// ERC 721 blance[adress] => 1 contract // records
// ERC 1155

contract RecordsContract is ERC1155Supply {
    //----------------------Permanent Uri code---------------------//

    /*  // Optional mapping for token URIs
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
    } */

    //----------------------Records Related code---------------------//

    uint256 newTokenId = 0;

    mapping(string => bool) recordTokenSymbol;
    mapping(uint256 => RecordToken) recordData;

    struct RecordToken {
        string name;
        string symbol;
        string image;
        uint256 seedId;
        uint256 parentId;
        string recordCategory;
        uint256 creationDate;
        // uint256 communityToken;
        // uint256 governanceToken;
    }

    event RecordCreated(
        string name,
        string symbol,
        string image,
        uint256 seedId,
        uint256 parentId,
        string recordCategory,
        uint256 creationDate
    );

    constructor() ERC1155("https://something.com/{id}") {}

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

    /**
     * @dev This function creats new record
     * @param name This is the total supply of governance token
     * @param symbol This is the total supply of community token
     * @param image This is the total supply of community token
     * @param seedId this is hash of the preview file
     * @param recordCategory this is hash of the preview file
     */
    function createNewRecord(
        string memory symbol,
        string memory name,
        string memory image,
        string memory recordCategory,
        uint256 seedId
    ) public returns (uint256 recordId) {
        require(recordTokenSymbol[symbol] == false, "SYMBOL_ALREADY_IN_USE");

        uint256 recordId = newTokenId++;
        _mint(msg.sender, recordId, 1, "");

        RecordToken memory recordToken = RecordToken({
            name: name,
            symbol: symbol,
            image: image,
            seedId: seedId,
            parentId: 0,
            recordCategory: recordCategory,
            creationDate: block.timestamp
        });

        recordTokenSymbol[symbol] = true;
        recordData[recordId] = recordToken;

        emit RecordCreated({
            name: name,
            symbol: symbol,
            image: image,
            seedId: seedId,
            parentId: 0,
            recordCategory: recordCategory,
            creationDate: block.timestamp
        });

        return (recordId);
    }
}
