pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RecordsContract.sol";

// ERC 20 balance[adress] => 2 contracts // governance and comunity
// ERC 721 blance[adress] => 1 contract // records
// ERC 1155

contract TreasuryContract is IERC1155Receiver, ERC1155Supply {
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

    /**
        @dev this is event which is created when a token transfer takes place
        @param from This is the address of sender 
        @param to This is the address of reciver 
        @param transferDate This is the date of the transfer
        @param tokenId This is the id of the token that is being transfered 
        @param amount This is the amount of token transfered 
        @param symbol This is the symbol of the token that were transfered
     */
    event TokenTransfer(
        address from,
        address to,
        uint256 transferDate,
        uint256 tokenId,
        uint256 amount,
        string symbol
    );

    /**
        @dev this is event which is created when new governance token is created (NEW CREATION Not MINITING)
        @param recordId This is the record Id to which this token belongs to 
        @param name This is the name of the token
        @param symbol This is the symbol of the governance token
        @param image This is the image of the token 
        @param creationDate This is the creation date of the token 
        @param tokenId This is the id of token that is newly created tokens 
     */
    event NewGovernanceTokenCreated(
        uint256 recordId,
        string name,
        string symbol,
        string image,
        uint256 creationDate,
        uint256 tokenId
    );

    /**
        @dev this is event which is created when new comunnity token is created (NEW CREATION Not MINITING)
        @param recordId This is the record Id to which this token belongs to 
        @param name This is the name of the token
        @param symbol This is the symbol of the governance token
        @param image This is the image of the token 
        @param creationDate This is the creation date of the token 
        @param tokenId This is the id of token that is newly created tokens 
     */
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
        _mint(address(this), 2, 1212 * 10**9, "");
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
    ) external payable returns (uint256) {
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

        // Here minting of new tokens is done. And those are sent directly into the treasury
        _mint(
            address(this),
            newTokenId,
            (totalSupply - userBalance) * 10**9,
            ""
        );
        emit TokenTransfer({
            from: 0x0000000000000000000000000000000000000000,
            to: address(this),
            transferDate: block.timestamp,
            tokenId: newTokenId,
            amount: (totalSupply - userBalance) * 10**9,
            symbol: symbol
        });

        // The user requested amount of tokens is genrated and send to his account
        _mint(msg.sender, newTokenId, userBalance * 10**9, "");
        emit TokenTransfer({
            from: 0x0000000000000000000000000000000000000000,
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

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external virtual override returns (bytes4) {
        return
            bytes4(
                keccak256(
                    "onERC1155Received(address,address,uint256,uint256,bytes)"
                )
            );
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external virtual override returns (bytes4) {
        return
            bytes4(
                keccak256(
                    "onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"
                )
            );
    }
}
