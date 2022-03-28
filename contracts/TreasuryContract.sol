pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RecordsContract.sol";

// ERC 20 balance[adress] => 2 contracts // governance and comunity
// ERC 721 blance[adress] => 1 contract // records
// ERC 1155

contract TreasuryContract is ERC1155Supply {
    uint256 public constant CRD = 1;
    uint256 private LastTokenId = 1;
    address public RECORDS_CONTRACT_ADDRESS;
    address OWNER;

    struct Token {
        uint256 recordId;
        string symbol;
        string image;
        uint256 creationDate;
        bool isPresent;
        uint256 tokenId;
    }

    event TokenTransfer(
        address from,
        address to,
        uint256 transferDate,
        uint256 tokenId,
        uint256 amount,
        string symbol
    );
    event NewGovernanceTokenCreated(
        uint256 recordId,
        string name,
        string symbol,
        string image,
        uint256 creationDate,
        uint256 tokenId
    );
    event NewCommunityTokenCreated(
        uint256 recordId,
        string name,
        string symbol,
        string image,
        uint256 creationDate,
        uint256 tokenId
    );

    mapping(uint256 => Token) govTokenMapping;
    mapping(uint256 => Token) commTokenMapping;

    mapping(string => bool) govTokenSym;
    mapping(string => bool) commTokenSym;

    // By default URI to crowdrecords domain
    // 9 decimal points supported
    constructor() ERC1155("https://crowdrecords.com/{id}") {
        _mint(msg.sender, CRD, 10**9, "https://crowdrecords.com");
        OWNER = msg.sender;
    }

    /**
     * @dev Modifier to check that the person who accesses a specific function is the owner of contract himself.
     */
    modifier ownerOnly() {
        require(msg.sender == OWNER, "You are not authorized for this action");
        _;
    }

    /**
     * @dev This function sets the Voting Contract address
     */
    function setRecordsContractAddress(address newRecordsContractAddress)
        public
        ownerOnly
    {
        RECORDS_CONTRACT_ADDRESS = newRecordsContractAddress;
    }

    /**
     * @dev This function creats new governance tokens for specified record
     * @param recordId This is the recordId that for new token
     * @param totalSupply This is the total supply of governance token
     * @param userBalance This is the amount of tokens that user wants to keep to himself
     * @param symbol This is the symbol of the gvernance token
     * @param image this is image of the gov token.
     */
    function createNewGovernanceToken(
        uint256 recordId,
        uint256 totalSupply,
        uint256 userBalance,
        string memory symbol,
        string memory image
    ) public returns (uint256) {
        require(
            govTokenMapping[recordId].isPresent == false,
            "Governance token for this id already present"
        );

        require(
            govTokenSym[symbol] == false,
            "Governance token with this SYMBOL already present"
        );

        require(
            totalSupply / 2 > userBalance,
            "Treasury should have at least 50% of the total supply"
        );

        RecordsContract recordsContract = RecordsContract(
            RECORDS_CONTRACT_ADDRESS
        );

        uint256 balance = recordsContract.balanceOf(msg.sender, recordId);

        require(balance > 0, "You are not the owner of the record");

        LastTokenId++;
        uint256 newTokenId = LastTokenId;

        _mint(address(this), newTokenId, userBalance - totalSupply * 10**9, "");
        emit TokenTransfer({
            from: address(this),
            to: address(this),
            transferDate: block.timestamp,
            tokenId: newTokenId,
            amount: userBalance - totalSupply * 10**9,
            symbol: symbol
        });

        _mint(msg.sender, newTokenId, userBalance * 10**9, "");
        emit TokenTransfer({
            from: address(this),
            to: msg.sender,
            transferDate: block.timestamp,
            tokenId: newTokenId,
            amount: userBalance * 10**9,
            symbol: symbol
        });

        Token memory token = Token({
            recordId: recordId,
            symbol: symbol,
            image: image,
            creationDate: block.timestamp,
            isPresent: true,
            tokenId: newTokenId
        });

        return newTokenId;
    }
}
