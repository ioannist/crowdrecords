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
    address public VOTING_CONTRACT_ADDRESS;
    address OWNER;
    string private PREFIX_GOVERNANCE = "CRDG_";
    string private PREFIX_COMMUNITY = "CRD_";
    uint8 private TOKEN_TYPE_COMMUNITY = 0;
    uint8 private TOKEN_TYPE_GOVERNANCE = 1;

    struct Token {
        uint256 recordId;
        string symbol;
        string image;
        uint256 creationDate;
        bool isPresent;
        uint256 tokenId;
    }

    struct NewTokenData {
        uint256 recordId;
        uint256 totalSupply;
        uint256 userBalance;
        string symbol;
        string image;
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
        @param symbol This is the symbol of the governance token
        @param image This is the image of the token 
        @param creationDate This is the creation date of the token 
        @param tokenAmount This is the amount of token that are created 
        @param tokenId This is the id of token that is newly created tokens 
        @param tokenType This is the type of the token that is created => For governance 1 and for copyright 0  
      */
    event NewTokenCreated(
        uint256 recordId,
        string symbol,
        string image,
        uint256 creationDate,
        uint256 tokenAmount,
        uint256 tokenId,
        uint8 tokenType
    );

    /**
        @dev this is event which is created when new governance token is minted after the voting is done
        @param recordId This is the record Id to which this token belongs to 
        @param creationDate This is the creation date of the token 
        @param tokenAmount This is the amount of token that are created 
        @param tokenId This is the id of token that is newly created tokens 
      */
    event TokenMinted(
        uint256 recordId,
        uint256 tokenId,
        uint256 creationDate,
        uint256 tokenAmount
    );


    /**
        @dev this is event which is genrated when a contribution voting has came to an end and the contribution is accepted
        @param to This the address of the winner or the owner of the contribution 
        @param recordId This is the id of the record to which this contribution relates to 
        @param contributionId This is the id of the contribution to which the record is related to 
        @param rewardGovernance The reward amount for governance tokens 
        @param rewardCommunity The reward amount for comunity tokens
     */
    event ContributionRewardTransfered(
        address to,
        uint256 recordId,
        uint256 contributionId,
        uint256 rewardGovernance,
        uint256 rewardCommunity
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
     * @dev Modifier to check if the sender is authorized to create tokens for this record.
     */
    modifier canCreateToken(
        NewTokenData memory newTokenData
    ) {
        require(
            newTokenData.totalSupply / 2 > newTokenData.userBalance,
            "Treasury should have at least 50% of the total supply"
        );

        RecordsContract recordsContract = RecordsContract(
            RECORDS_CONTRACT_ADDRESS
        );

        uint256 balance = recordsContract.balanceOf(msg.sender, newTokenData.recordId);

        require(balance > 0, "You are not the owner of the record");
        _;
    }

    /**
     * @dev Modifier to check that if the sender is the voting contract or not.
     */
    modifier onlyVotingContract() {
        require(
            msg.sender == VOTING_CONTRACT_ADDRESS,
            "You are not authorized for this action"
        );
        _;
    }

    /**
     * @dev This function sets the Records Contract address
     */
    function setRecordsContractAddress(address newRecordsContractAddress)
        public
        ownerOnly
    {
        RECORDS_CONTRACT_ADDRESS = newRecordsContractAddress;
    }

    /**
     * @dev This function sets the Voting Contract address
     */
    function setVotingContractAddress(address newVotingContractAddress)
        public
        ownerOnly
    {
        VOTING_CONTRACT_ADDRESS = newVotingContractAddress;
    }

    /**
     * @dev This function creats new governance tokens for specified record
     * @param newTokenData This contains all the parameters needed to create a new governance token that are
     * - recordId This is the recordId that for new token
     * - totalSupply This is the total supply of governance token
     * - userBalance This is the amount of tokens that user wants to keep to himself
     * - symbol This is the symbol of the gvernance token
     * - image this is image of the gov token.
     */
    function createNewGovernanceToken(
        NewTokenData memory newTokenData
    )
        external
        payable
            canCreateToken(newTokenData)
        returns (
            uint256
        )
    {

        {
            bytes memory preString = abi.encodePacked(PREFIX_GOVERNANCE);
            newTokenData.symbol = string(abi.encodePacked(preString, newTokenData.symbol));
        }
        
        require(
            govTokenMapping[newTokenData.recordId].isPresent == false,
            "Governance token for this id already present"
        );

        require(
            govTokenSym[newTokenData.symbol] == false,
            "Governance token with this SYMBOL already present"
        );

        LastTokenId++;
        uint256 newTokenId = LastTokenId;

        //Map the recordId with the
        govTokenMapping[newTokenData.recordId] = createToken(newTokenData, newTokenId,TOKEN_TYPE_GOVERNANCE);

        return newTokenId;
    }

    /**
     * @dev This function creats new community tokens for specified record
     * @param newTokenData This contains all the parameters needed to create a new community token that are
     * - recordId This is the recordId that for new token
     * - totalSupply This is the total supply of community token
     * - userBalance This is the amount of tokens that user wants to keep to himself
     * - symbol This is the symbol of the community token
     * - image this is image of the gov token.
     */
    function createNewCommunityToken(
        NewTokenData memory newTokenData
    )
        external
        payable
            canCreateToken(newTokenData)
        returns (
            uint256
        )
    {

        {
            bytes memory preString = abi.encodePacked(PREFIX_COMMUNITY);
            newTokenData.symbol = string(abi.encodePacked(preString, newTokenData.symbol));
        }
        
        require(
            commTokenMapping[newTokenData.recordId].isPresent == false,
            "Governance token for this id already present"
        );

        require(
            commTokenSym[newTokenData.symbol] == false,
            "Governance token with this SYMBOL already present"
        );

        LastTokenId++;
        uint256 newTokenId = LastTokenId;

        //Map the recordId with the
        commTokenMapping[newTokenData.recordId] = createToken(newTokenData, newTokenId,TOKEN_TYPE_COMMUNITY);

        return newTokenId;
    }

    /**
     * @dev This function is an internal use only function whoes role is to create a new token of specified type
     * @param newTokenData This contains all the parameters needed to create a new community token that are
     * - recordId This is the recordId that for new token
     * - totalSupply This is the total supply of community token
     * - userBalance This is the amount of tokens that user wants to keep to himself
     * - symbol This is the symbol of the community token
     * - image this is image of the gov token.
     * @param newTokenId This is the Id of the token to create
     * @param tokenType This is the type of token that is to be created such as community or governance
     */
    function createToken (NewTokenData memory newTokenData,uint256 newTokenId,uint8 tokenType) private returns(Token memory){

        uint256 treasuryAmount = (newTokenData.totalSupply - newTokenData.userBalance);
        uint256 userAmount = newTokenData.userBalance;

        // Here minting of new tokens is done. And those are sent directly into the treasury
        _mint(address(this), newTokenId, treasuryAmount, "");

        // The user requested amount of tokens is genrated and send to his account
        _mint(msg.sender, newTokenId, userAmount, "");

        Token memory token = Token({
            recordId: newTokenData.recordId,
            symbol: newTokenData.symbol,
            image: newTokenData.image,
            creationDate: block.timestamp,
            isPresent: true,
            tokenId: newTokenId
        });
        
        emit NewTokenCreated({
            recordId : newTokenData.recordId,
            symbol : newTokenData.symbol,
            image : newTokenData.image,
            creationDate : token.creationDate,
            tokenAmount : newTokenData.totalSupply,
            tokenId : newTokenId,
            tokenType : tokenType
        });

        return token;
    }

    /**
     * @dev This function creats new community tokens for specified record
     * @param recordId This is the id of the record to which the token belongs to
     * @param tokenId This is the id of the which is to be minted
     * @param tokenAmount This is the amount that is to be minted
     */
    function mintTokens(
        uint256 recordId,
        uint256 tokenId,
        uint256 tokenAmount
    )
        external
        payable
            onlyVotingContract
    {

        require(
            commTokenMapping[recordId].isPresent == true ||
            govTokenMapping[recordId].isPresent == true,
            "Invalid record "
        );

        require(
            commTokenMapping[recordId].tokenId == tokenId ||
            govTokenMapping[recordId].tokenId == tokenId,
            "Invalid tokens"
        );

            // Here minting of new tokens is done. And those are sent directly into the treasury
        _mint(address(this), tokenId, tokenAmount, "Token minted through voting process");

        emit TokenMinted({
            recordId : recordId,
            tokenId : tokenId,
            creationDate : block.timestamp,
            tokenAmount : tokenAmount
        });

    }

    /**
     * @dev This function is called only by the voting contract once the voting ends
     * @param to This is the recivers address
     * @param recordId This is the recordId to which the contribution belongs to
     * @param contributionId this is the contribution id to which the user has won
     * @param rewardGovernance this is the amout of Governance token that needs to be transfered
     * @param rewardCommunity this is the amout of comunity token that needs to be transfered
     */
    function transferRewardAmount(
        address to,
        uint256 recordId,
        uint256 contributionId,
        uint256 rewardGovernance,
        uint256 rewardCommunity
    ) external payable onlyVotingContract {
        _setApprovalForAll(address(this), VOTING_CONTRACT_ADDRESS, true);
        if (rewardGovernance > 0) {
            safeTransferFrom(
                address(this),
                to,
                govTokenMapping[recordId].tokenId,
                rewardGovernance,
                ""
            );

        }

        if (rewardCommunity > 0) {
            safeTransferFrom(
                address(this),
                to,
                commTokenMapping[recordId].tokenId,
                rewardCommunity,
                ""
            );

        }

        emit ContributionRewardTransfered({
            to: to,
            recordId: recordId,
            contributionId: contributionId,
            rewardGovernance: rewardGovernance,
            rewardCommunity: rewardCommunity
        });
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
