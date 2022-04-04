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
        @param symbol This is the symbol of the governance token
        @param image This is the image of the token 
        @param creationDate This is the creation date of the token 
        @param tokenId This is the id of token that is newly created tokens 
     */
    event NewGovernanceTokenCreated(
        uint256 recordId,
        string symbol,
        string image,
        uint256 creationDate,
        uint256 tokenId
    );

    /**
        @dev this is event which is created when new comunnity token is created (NEW CREATION Not MINITING)
        @param recordId This is the record Id to which this token belongs to 
        @param symbol This is the symbol of the governance token
        @param image This is the image of the token 
        @param creationDate This is the creation date of the token 
        @param tokenId This is the id of token that is newly created tokens 
     */
    event NewCommunityTokenCreated(
        uint256 recordId,
        string symbol,
        string image,
        uint256 creationDate,
        uint256 tokenId
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
        uint256 recordId,
        uint256 totalSupply,
        uint256 userBalance
    ) {
        require(
            totalSupply / 2 > userBalance,
            "Treasury should have at least 50% of the total supply"
        );

        RecordsContract recordsContract = RecordsContract(
            RECORDS_CONTRACT_ADDRESS
        );

        uint256 balance = recordsContract.balanceOf(msg.sender, recordId);

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
    )
        external
        payable
        returns (
            // canCreateToken(recordId, totalSupply, userBalance)
            uint256
        )
    {
        symbol = string(bytes.concat(bytes(PREFIX_GOVERNANCE), bytes(symbol)));

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

        uint256 treasuryAmount = (totalSupply - userBalance);
        uint256 userAmount = userBalance;

        // Here minting of new tokens is done. And those are sent directly into the treasury
        _mint(address(this), newTokenId, treasuryAmount, "");
        emit TokenTransfer({
            from: 0x0000000000000000000000000000000000000000,
            to: address(this),
            transferDate: block.timestamp,
            tokenId: newTokenId,
            amount: treasuryAmount,
            symbol: symbol
        });

        // The user requested amount of tokens is genrated and send to his account
        _mint(msg.sender, newTokenId, userAmount, "");
        emit TokenTransfer({
            from: 0x0000000000000000000000000000000000000000,
            to: msg.sender,
            transferDate: block.timestamp,
            tokenId: newTokenId,
            amount: userAmount,
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

        //Map the recordId with the
        govTokenMapping[recordId] = token;

        return newTokenId;
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

            emit TokenTransfer({
                from: address(this),
                to: to,
                transferDate: block.timestamp,
                tokenId: govTokenMapping[recordId].tokenId,
                amount: rewardGovernance,
                symbol: govTokenMapping[recordId].symbol
            });
        }

        if (rewardCommunity > 0) {
            safeTransferFrom(
                address(this),
                to,
                commTokenMapping[recordId].tokenId,
                rewardCommunity,
                ""
            );

            emit TokenTransfer({
                from: address(this),
                to: to,
                transferDate: block.timestamp,
                tokenId: commTokenMapping[recordId].tokenId,
                amount: rewardCommunity,
                symbol: commTokenMapping[recordId].symbol
            });
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
