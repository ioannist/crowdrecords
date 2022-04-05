pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ERC 20 balance[adress] => 2 contracts // governance and comunity
// ERC 721 blance[adress] => 1 contract // records
// ERC 1155

contract RecordsContract is ERC1155Supply {
    uint256 newTokenId = 0;

    mapping(uint256 => RecordToken) recordData;

    struct RecordToken {
        string name;
        string image;
        uint256 seedId;
        uint256 parentId;
        string recordCategory;
        uint256 creationDate;
    }

    /**
     * @dev This event is emited when new record is created
     * @param recordId This is the recordId
     * @param name Name of the record
     * @param image This is the image of the record
     * @param seedId This is the seed contribution id
     * @param parentId This is the id of the parent record from which record is created
     * @param recordCategory This is the record category
     * @param creationDate This is the creation date of the record
     */
    event RecordCreated(
        uint256 recordId,
        string name,
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
     * @param image This is the total supply of community token
     * @param seedId this is hash of the preview file
     * @param recordCategory this is hash of the preview file
     */
    function createNewRecord(
        string memory name,
        string memory image,
        string memory recordCategory,
        uint256 seedId
    ) public returns (uint256 recordId) {
        newTokenId++;
        uint256 recordId = newTokenId;
        _mint(msg.sender, recordId, 1, "");

        RecordToken memory recordToken = RecordToken({
            name: name,
            image: image,
            seedId: seedId,
            parentId: 0,
            recordCategory: recordCategory,
            creationDate: block.timestamp
        });

        recordData[recordId] = recordToken;

        emit RecordCreated({
            recordId: recordId,
            name: name,
            image: image,
            seedId: seedId,
            parentId: 0,
            recordCategory: recordCategory,
            creationDate: recordToken.creationDate
        });

        return (recordId);
    }
}
