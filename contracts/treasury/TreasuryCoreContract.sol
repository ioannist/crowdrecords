pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../interface/IRecords.sol";
import "../interface/IERC20.sol";
import "../ERC1155/SnapshotERC1155.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../voting/VotingHubContract.sol";

contract TreasuryCoreContract is
    IERC1155Receiver,
    SnapshotERC1155,
    Initializable
{
    uint256 public constant CRD = 1;
    uint256 private LastTokenId = 1;
    address public VOTING_HUB_ADDRESS;
    address public TREASURY_CONTRACT_ADDRESS;
    address public CONTROLLER_CONTRACT_ADDRESS;
    address public OWNER;
    string private PREFIX_GOVERNANCE = "CRDG_";
    string private PREFIX_COMMUNITY = "CRD_";
    uint8 private TOKEN_TYPE_COMMUNITY = 0;
    uint8 private TOKEN_TYPE_GOVERNANCE = 1;
    IERC20 private crdTokenContract;

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

    mapping(uint256 => Token) public govTokenMapping;
    mapping(uint256 => Token) public commTokenMapping;

    // TokenSymbol => boolean, it denotes if a token name is taken or not,
    // if it is true it means that the token name is already taken
    mapping(string => bool) public govTokenSym;
    mapping(string => bool) public commTokenSym;

    // By default URI to crowdrecords domain
    // 18 decimal points supported
    constructor(address owner) ERC1155("https://crowdrecords.com/{id}") {
        OWNER = owner;
        // Setting the empty value for tokens as used so that no other user can create token with empty symbol
        govTokenSym[""] = true;
        commTokenSym[""] = true;
    }

    /// @dev Modifier to check that the person who accesses a specific function is the owner of contract himself.
    modifier ownerOnly() {
        require(msg.sender == OWNER, "UNAUTHORIZED: CANNOT_PERFORM_ACTION");
        _;
    }

    /// @dev Modifier to check that the caller is the treasury contract
    modifier onlyTreasuryContract() {
        require(
            msg.sender == TREASURY_CONTRACT_ADDRESS,
            "UNAUTHORIZED: CANNOT_PERFORM_ACTION"
        );
        _;
    }

    /// @dev Modifier to check that the caller is the treasury contract or controller contract
    modifier onlyTreasuryAndControllerContract() {
        require(
            msg.sender == TREASURY_CONTRACT_ADDRESS ||
                msg.sender == CONTROLLER_CONTRACT_ADDRESS,
            "UNAUTHORIZED: CANNOT_PERFORM_ACTION"
        );
        _;
    }

    /// @dev This is to set the address of the contracts
    /// @param newVotingHubContract This is the address of new voting hub contract
    /// @param newTreasuryAddress This is the address of new voting hub contract
    /// @param crdTokenAddress This is the address of CRD token contract
    /// @param controllerContractAddress This is the address of Controller contract
    function initialize(
        address newVotingHubContract,
        address newTreasuryAddress,
        address crdTokenAddress,
        address controllerContractAddress
    ) public initializer ownerOnly {
        VOTING_HUB_ADDRESS = newVotingHubContract;
        TREASURY_CONTRACT_ADDRESS = newTreasuryAddress;
        CONTROLLER_CONTRACT_ADDRESS = controllerContractAddress;
        crdTokenContract = IERC20(crdTokenAddress);
    }

    /// @dev This function creates new governance tokens for specified record
    /// @param newTokenData This contains all the parameters needed to create a new governance token that are
    /// @param userAddress - This is the address of the user who is the creator of the token
    function createNewGovernanceToken(
        NewTokenData memory newTokenData,
        address userAddress
    ) external onlyTreasuryAndControllerContract returns (uint256) {
        {
            govTokenSym[newTokenData.symbol] = true;
            bytes memory preString = abi.encodePacked(PREFIX_GOVERNANCE);
            newTokenData.symbol = string(
                abi.encodePacked(preString, newTokenData.symbol)
            );
        }

        LastTokenId++;
        uint256 newTokenId = LastTokenId;

        //Map the recordId with the
        govTokenMapping[newTokenData.recordId] = createToken(
            newTokenData,
            newTokenId,
            TOKEN_TYPE_GOVERNANCE,
            userAddress
        );

        return newTokenId;
    }

    /// @dev This function creates new community tokens for specified record
    /// @param newTokenData This contains all the parameters needed to create a new community token that are
    /// @param userAddress - This is the address of the user who is the creator of the token
    function createNewCommunityToken(
        NewTokenData memory newTokenData,
        address userAddress
    ) external onlyTreasuryAndControllerContract returns (uint256) {
        {
            commTokenSym[newTokenData.symbol] = true;
            bytes memory preString = abi.encodePacked(PREFIX_COMMUNITY);
            newTokenData.symbol = string(
                abi.encodePacked(preString, newTokenData.symbol)
            );
        }

        LastTokenId++;
        uint256 newTokenId = LastTokenId;

        //Map the recordId with the
        commTokenMapping[newTokenData.recordId] = createToken(
            newTokenData,
            newTokenId,
            TOKEN_TYPE_COMMUNITY,
            userAddress
        );

        return newTokenId;
    }

    /// @dev This function is an internal use only function whoes role is to create a new token of specified type
    /// @param newTokenData This contains all the parameters needed to create a new community token that are
    /// @param newTokenId - This is the Id of the token to create
    /// @param tokenType - This is the type of token that is to be created such as community or governance
    /// @param userAddress - This is the address of the user who is the creator of the token
    function createToken(
        NewTokenData memory newTokenData,
        uint256 newTokenId,
        uint8 tokenType,
        address userAddress
    ) private returns (Token memory) {
        uint256 treasuryAmount = (newTokenData.totalSupply -
            newTokenData.userBalance);
        uint256 userAmount = newTokenData.userBalance;

        // Here minting of new tokens is done. And those are sent directly into the treasury
        _mint(address(this), newTokenId, treasuryAmount, "");

        // The user requested amount of tokens is generated and send to his account
        _mint(userAddress, newTokenId, userAmount, "");

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
    ) external onlyTreasuryContract {
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
    ) external onlyTreasuryContract {
        _setApprovalForAll(address(this), msg.sender, true);
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

    /// @dev This function sets the symbol name as used, this function is called from records
    // contract to reserve symbol for new version creation
    /// @param governanceSymbol Symbol for governance token
    /// @param communitySymbol Symbol for community token
    function setSymbolsAsUsed(
        string memory governanceSymbol,
        string memory communitySymbol
    ) external onlyTreasuryContract {
        commTokenSym[communitySymbol] = true;
        govTokenSym[governanceSymbol] = true;
    }

    /// @dev This function sets the symbol name as available, this function is called from records
    // contract to reserve symbol for new version creation
    /// @param governanceSymbol Symbol for governance token
    /// @param communitySymbol Symbol for community token
    function setSymbolsAsAvailable(
        string memory governanceSymbol,
        string memory communitySymbol
    ) external onlyTreasuryContract {
        commTokenSym[communitySymbol] = false;
        govTokenSym[governanceSymbol] = false;
    }

    /// @dev This function checks if symbol are available or not
    /// @param governanceSymbol Symbol for governance token
    /// @param communitySymbol Symbol for community token
    function isSymbolAvailable(
        string memory governanceSymbol,
        string memory communitySymbol
    ) external onlyTreasuryContract {
        require(!commTokenSym[communitySymbol], "SYMBOL_C_TAKEN");
        require(!govTokenSym[governanceSymbol], "SYMBOL_G_TAKEN");
    }

    /// @dev this function is responsible for minting of new tokens for records
    /// @param tokenId Id this is the tokenId that is to minted
    /// @param amount the amount that is to be minted
    /// @param receiver Id this is the tokenId that is to minted
    function transferRewardTokens(
        uint256 tokenId,
        uint256 amount,
        address receiver
    ) public onlyTreasuryContract {
        _setApprovalForAll(address(this), msg.sender, true);
        safeTransferFrom(
            address(this),
            receiver,
            tokenId,
            amount,
            "RECORD_TOKEN_TRANSFER"
        );
    }

    /// @dev The safeTransferFrom method has been overriden so that whenever we
    /// need to transfer the CRD token from one address to another that can be done
    /// within the same function
    /// @param from this is the address of the user from whose account the token is to be deducted
    /// @param to this is the account of user where the token will be deposited
    /// @param id this is the id of the token that is to be transferred
    /// @param amount the amount of token to be transferred
    /// @param data extra information for the transaction
    function _safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal virtual override {
        if (id == CRD) {
            crdTokenContract.safeTransferFrom(from, to, amount);
        } else {
            super._safeTransferFrom(from, to, id, amount, data);
        }
    }

    /// @dev this function is responsible to return the balance of a token
    /// Here it has been overridden so that any request for CRD token will be
    /// redirected to the ERC20 contract of CRD token
    /// @param account this is the address of the user whose balance you want to check
    /// @param id this is the id of the token that is to be transferred
    /// @return balance This is the balance of the user
    function balanceOf(
        address account,
        uint256 id
    ) public view virtual override returns (uint256) {
        if (id == CRD) return crdTokenContract.balanceOf(account);
        else return super.balanceOf(account, id);
    }

    function snapshot()
        external
        onlyTreasuryContract
        returns (uint256 snapshotId)
    {
        return _snapshot();
    }

    function mint(
        uint256 tokenId,
        uint256 amount
    ) external onlyTreasuryContract {
        require(tokenId > 1, "INV: TOKENID");
        _mint(address(this), tokenId, amount, "New tokens minted");
    }

    function _mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override {
        require(id > 1, "INV: TOKENID");
        super._mint(to, id, amount, data);
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
