pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RecordsContract.sol";
import "./ERC1155/SnapshotERC1155.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./voting/VotingHubContract.sol";

contract TreasuryContract is IERC1155Receiver, SnapshotERC1155 {
    uint256 public constant CRD = 1;
    uint256 private LastTokenId = 1;
    address public RECORDS_CONTRACT_ADDRESS;
    address public CONTRIBUTION_VOTING_CONTRACT_ADDRESS;
    address public DILUTION_CONTRACT_ADDRESS;
    address public VOTING_HUB_ADDRESS;
    address public OWNER;
    string private PREFIX_GOVERNANCE = "CRDG_";
    string private PREFIX_COMMUNITY = "CRD_";
    uint8 private TOKEN_TYPE_COMMUNITY = 0;
    uint8 private TOKEN_TYPE_GOVERNANCE = 1;

    /// @dev This structure will store information of tokens for each records
    /// @param recordId This is the id of record to which a token belongs
    /// @param symbol This is the symbol of a token
    /// @param image This is the token image
    /// @param creationDate This is the block number of creation date
    /// @param isPresent This is to check if a token struct exists or not
    /// @param tokenId This is the id of the token that is created
    struct Token {
        uint256 recordId;
        string symbol;
        string image;
        uint256 creationDate;
        bool isPresent;
        uint256 tokenId;
    }

    /// @dev This structure will store information of the contribution
    /// @param recordId This is the id of the record to which contribution belongs to
    /// @param totalSupply Total supply of token
    /// @param userBalance The amount of tokens that goes into creators wallet
    /// @param symbol This is the symbol of the token
    /// @param image This is the link of the image / icon of the token
    struct NewTokenData {
        uint256 recordId;
        uint256 totalSupply;
        uint256 userBalance;
        string symbol;
        string image;
    }

    /// @dev this is event which is created when a token transfer takes place
    /// @param from This is the address of sender
    /// @param to This is the address of receiver
    /// @param transferDate This is the date of the transfer
    /// @param tokenId This is the id of the token that is being transferred
    /// @param amount This is the amount of token transferred
    /// @param symbol This is the symbol of the token that were transferred
    event TokenTransfer(
        address from,
        address to,
        uint256 transferDate,
        uint256 tokenId,
        uint256 amount,
        string symbol
    );

    /// @dev this is event which is created when new governance token is created (NEW CREATION Not MINTING)
    /// @param recordId This is the record Id to which this token belongs to
    /// @param symbol This is the symbol of the governance token
    /// @param image This is the image of the token
    /// @param creationDate This is the creation date of the token
    /// @param tokenAmount This is the amount of token that are created
    /// @param tokenId This is the id of token that is newly created tokens
    /// @param tokenType This is the type of the token that is created => For governance 1 and for copyright 0
    event NewTokenCreated(
        uint256 recordId,
        string symbol,
        string image,
        uint256 creationDate,
        uint256 tokenAmount,
        uint256 tokenId,
        uint8 tokenType
    );

    /// @dev this is event which is created when new governance token is minted after the voting is done
    /// @param recordId This is the record Id to which this token belongs to
    /// @param creationDate This is the creation date of the token
    /// @param tokenAmount This is the amount of token that are created
    /// @param tokenId This is the id of token that is newly created tokens
    event TokenMinted(
        uint256 recordId,
        uint256 tokenId,
        uint256 creationDate,
        uint256 tokenAmount
    );

    /// @dev this is event which is generated when a contribution voting has came to an
    /// end and the contribution is accepted
    /// @param to This the address of the winner or the owner of the contribution
    /// @param recordId This is the id of the record to which this contribution relates to
    /// @param contributionId This is the id of the contribution to which the record is related to
    /// @param rewardGovernance The reward amount for governance tokens
    /// @param rewardCommunity The reward amount for community tokens
    event ContributionRewardTransferred(
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
    // 18 decimal points supported
    constructor(address owner) ERC1155("https://crowdrecords.com/{id}") {
        _mint(owner, CRD, 1000000 * 10**18, "https://crowdrecords.com");
        OWNER = owner;
    }

    /// @dev Modifier to check that the person who accesses a specific function is the owner of contract himself.
    modifier ownerOnly() {
        require(msg.sender == OWNER, "UNAUTHORIZED: CANNOT_PERFORM_ACTION");
        _;
    }

    /// @dev Modifier to check if the sender is authorized to create tokens for this record.
    /// @param newTokenData This is the NewTokenData structure that needs to be passed to create a new token,
    /// here it is passed to check if the token can be created with respected data
    modifier canCreateToken(NewTokenData memory newTokenData) {
        require(
            newTokenData.totalSupply / 2 > newTokenData.userBalance,
            "INVALID: TREASURY_SHOULD_HAVE_50%_OF_SUPPLY"
        );

        RecordsContract recordsContract = RecordsContract(
            RECORDS_CONTRACT_ADDRESS
        );

        uint256 balance = recordsContract.balanceOf(
            msg.sender,
            newTokenData.recordId
        );

        require(balance > 0, "INVALID: ONLY_RECORD_OWNER");
        _;
    }

    /// @dev Modifier to check that if the sender is the voting contract or not.
    modifier onlyContributionVotingContract() {
        require(
            msg.sender == CONTRIBUTION_VOTING_CONTRACT_ADDRESS,
            "UNAUTHORIZED: CANNOT_PERFORM_ACTION"
        );
        _;
    }

    /// @dev Modifier to check that if the sender is the dilution contract or not.
    modifier onlyDilutionContract() {
        require(
            msg.sender == DILUTION_CONTRACT_ADDRESS,
            "UNAUTHORIZED: CANNOT_PERFORM_ACTION"
        );
        _;
    }

    /// @dev This function sets the Owners address
    /// @param ownerAddress This is the address of new owner of contract
    function setOwnerAddress(address ownerAddress) public ownerOnly {
        OWNER = ownerAddress;
    }

    /// @dev This function sets the Records Contract address
    /// @param newRecordsContractAddress This is the address of new Records contract
    function setRecordsContractAddress(address newRecordsContractAddress)
        public
        ownerOnly
    {
        RECORDS_CONTRACT_ADDRESS = newRecordsContractAddress;
    }

    /// @dev This function sets the Records Contract address
    /// @param newVotingHubContract This is the address of new voting hub contract
    function setVotingHubContract(address newVotingHubContract)
        public
        ownerOnly
    {
        VOTING_HUB_ADDRESS = newVotingHubContract;
    }

    /// @dev This function sets the dilution Contract address
    /// @param newDilutionContract This is the address of new dilution contract
    function setDilutionContract(address newDilutionContract) public ownerOnly {
        DILUTION_CONTRACT_ADDRESS = newDilutionContract;
    }

    /// @dev This function sets the Voting Contract address

    function setContributionVotingContractAddress(
        address newVotingContractAddress
    ) public ownerOnly {
        CONTRIBUTION_VOTING_CONTRACT_ADDRESS = newVotingContractAddress;
    }

    /// @dev This function creates new governance tokens for specified record
    /// @param newTokenData This contains all the parameters needed to create a new governance token that are
    function createNewGovernanceToken(NewTokenData memory newTokenData)
        external
        payable
        canCreateToken(newTokenData)
        returns (uint256)
    {
        {
            bytes memory preString = abi.encodePacked(PREFIX_GOVERNANCE);
            newTokenData.symbol = string(
                abi.encodePacked(preString, newTokenData.symbol)
            );
        }

        require(
            govTokenMapping[newTokenData.recordId].isPresent == false,
            "INVALID: TOKEN_ID_ALREADY_IN_USE"
        );

        require(
            govTokenSym[newTokenData.symbol] == false,
            "INVALID: TOKEN_SYMBOL_ALREADY_IN_USE"
        );

        LastTokenId++;
        uint256 newTokenId = LastTokenId;

        //Map the recordId with the
        govTokenMapping[newTokenData.recordId] = createToken(
            newTokenData,
            newTokenId,
            TOKEN_TYPE_GOVERNANCE
        );

        return newTokenId;
    }

    /// @dev This function creats new community tokens for specified record
    /// @param newTokenData This contains all the parameters needed to create a new community token that are
    function createNewCommunityToken(NewTokenData memory newTokenData)
        external
        payable
        canCreateToken(newTokenData)
        returns (uint256)
    {
        {
            bytes memory preString = abi.encodePacked(PREFIX_COMMUNITY);
            newTokenData.symbol = string(
                abi.encodePacked(preString, newTokenData.symbol)
            );
        }

        require(
            commTokenMapping[newTokenData.recordId].isPresent == false,
            "INVALID: TOKEN_ID_ALREADY_IN_USE"
        );

        require(
            commTokenSym[newTokenData.symbol] == false,
            "INVALID: TOKEN_SYMBOL_ALREADY_IN_USE"
        );

        LastTokenId++;
        uint256 newTokenId = LastTokenId;

        //Map the recordId with the
        commTokenMapping[newTokenData.recordId] = createToken(
            newTokenData,
            newTokenId,
            TOKEN_TYPE_COMMUNITY
        );

        return newTokenId;
    }

    /// @dev This function is an internal use only function whoes role is to create a new token of specified type
    /// @param newTokenData This contains all the parameters needed to create a new community token that are
    /// @param newTokenId - This is the Id of the token to create
    /// @param tokenType - This is the type of token that is to be created such as community or governance
    function createToken(
        NewTokenData memory newTokenData,
        uint256 newTokenId,
        uint8 tokenType
    ) private returns (Token memory) {
        //!Add check for the totalsupply > userBalance

        uint256 treasuryAmount = (newTokenData.totalSupply -
            newTokenData.userBalance);
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
            recordId: newTokenData.recordId,
            symbol: newTokenData.symbol,
            image: newTokenData.image,
            creationDate: token.creationDate,
            tokenAmount: newTokenData.totalSupply,
            tokenId: newTokenId,
            tokenType: tokenType
        });

        return token;
    }

    /// @dev This function creats new community tokens for specified record
    /// @param recordId This is the id of the record to which the token belongs to
    /// @param tokenId This is the id of the which is to be minted
    /// @param tokenAmount This is the amount that is to be minted
    function mintTokens(
        uint256 recordId,
        uint256 tokenId,
        uint256 tokenAmount
    ) external payable onlyContributionVotingContract {
        require(
            commTokenMapping[recordId].isPresent == true ||
                govTokenMapping[recordId].isPresent == true,
            "INVALID: WRONG_RECORD_ID"
        );

        require(
            commTokenMapping[recordId].tokenId == tokenId ||
                govTokenMapping[recordId].tokenId == tokenId,
            "INVALID: WRONG_TOKEN_ID"
        );

        // Here minting of new tokens is done. And those are sent directly into the treasury
        _mint(
            address(this),
            tokenId,
            tokenAmount,
            "Token minted through voting process"
        );

        emit TokenMinted({
            recordId: recordId,
            tokenId: tokenId,
            creationDate: block.timestamp,
            tokenAmount: tokenAmount
        });
    }

    /// @dev This function is called only by the voting contract once the voting ends
    /// @param to This is the receivers address
    /// @param recordId This is the recordId to which the contribution belongs to
    /// @param contributionId this is the contribution id to which the user has won
    /// @param rewardGovernance this is the amount of Governance token that needs to be transferred
    /// @param rewardCommunity this is the amount of community token that needs to be transferred
    function transferRewardAmount(
        address to,
        uint256 recordId,
        uint256 contributionId,
        uint256 rewardGovernance,
        uint256 rewardCommunity
    ) external payable onlyContributionVotingContract {
        _setApprovalForAll(
            address(this),
            CONTRIBUTION_VOTING_CONTRACT_ADDRESS,
            true
        );
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

        emit ContributionRewardTransferred({
            to: to,
            recordId: recordId,
            contributionId: contributionId,
            rewardGovernance: rewardGovernance,
            rewardCommunity: rewardCommunity
        });
    }

    /// @dev This function gives you the community token id of the recordId that you pass
    /// @param recordId This is the Id of the token that you want to check
    function getCommunityTokenId(uint256 recordId)
        public
        view
        returns (uint256)
    {
        Token memory token = commTokenMapping[recordId];
        if (token.isPresent) {
            return token.tokenId;
        } else {
            revert("INVALID: WRONG_RECORD_ID");
        }
    }

    /// @dev This function gives you the governance token id of the recordId that you pass
    /// @param recordId This is the Id of the token that you want to check
    function getGovernanceTokenId(uint256 recordId)
        public
        view
        returns (uint256)
    {
        Token memory token = govTokenMapping[recordId];
        if (token.isPresent) {
            return token.tokenId;
        } else {
            revert("INVALID: WRONG_RECORD_ID");
        }
    }

    /// @dev This function returns the amount of total tokens that are in circulation
    /// @param tokenId This is the token whose circulating supply you  want to find out
    function totalCirculatingSupply(uint256 tokenId)
        public
        view
        returns (uint256)
    {
        uint256 totalCirculatingBalance = SafeMath.sub(
            totalSupply(tokenId),
            balanceOf(address(this), tokenId)
        );

        return totalCirculatingBalance;
    }

    function snapshot() public returns (uint256 snapshotId) {
        return _snapshot();
    }

    // Update balance and/or total supply snapshots before the values are modified. This is implemented
    // in the _beforeTokenTransfer hook, which is executed for _mint, _burn, and _transfer operations.
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {
        //Below condition is needed as the _mint is called in the constructor
        //and at that particular point in time the below address is not initialized thus leading to a revert
        if (VOTING_HUB_ADDRESS != address(0)) {
            VotingHubContract votingHubContract = VotingHubContract(
                VOTING_HUB_ADDRESS
            );

            for (uint256 i = 0; i < ids.length; i++) {
                votingHubContract.handleUserTokenTransfers(
                    from,
                    to,
                    amounts[i],
                    ids[i]
                );
            }
        }

        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    /// @dev this function is responsible for minting of new tokens for records
    /// @param tokenId Id this is the tokenId that is to minted
    /// @param amount the amount that is to be minted
    function mintTokens(uint256 tokenId, uint256 amount)
        public
        onlyDilutionContract
    {
        _mint(address(this), tokenId, amount, "New tokens minted");
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
