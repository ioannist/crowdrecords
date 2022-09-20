pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interface/IRecords.sol";
import "../ERC1155/SnapshotERC1155.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../voting/VotingHubContract.sol";
import "./TreasuryCoreContract.sol";

contract TreasuryContract {
    uint256 public constant CRD = 1;
    address public OWNER;
    address public RECORDS_CONTRACT_ADDRESS;
    address public CONTRIBUTION_VOTING_CONTRACT_ADDRESS;
    address public DILUTION_CONTRACT_ADDRESS;
    address public TREASURY_CORE_CONTRACT_ADDRESS;

    constructor(address owner) {
        OWNER = owner;
    }

    /// @dev Modifier to check that the person who accesses a specific function is the owner of contract himself.
    modifier ownerOnly() {
        require(msg.sender == OWNER, "UNAUTHORIZED: CANNOT_PERFORM_ACTION");
        _;
    }

    /// @dev Modifier to check that the calls are made by records contract only
    modifier onlyRecordsContract() {
        require(
            msg.sender == RECORDS_CONTRACT_ADDRESS,
            "UNAUTHORIZED: ONLY_RECORDS_CONTRACT"
        );
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

    /// @dev Modifier to check if the sender is authorized to create tokens for this record.
    /// @param newTokenData This is the NewTokenData structure that needs to be passed to create a new token,
    /// here it is passed to check if the token can be created with respected data
    modifier canCreateToken(
        TreasuryCoreContract.NewTokenData memory newTokenData
    ) {
        require(
            newTokenData.totalSupply / 2 > newTokenData.userBalance,
            "INVALID: TREASURY_SHOULD_HAVE_50%_OF_SUPPLY"
        );

        IRecords recordsContract = IRecords(RECORDS_CONTRACT_ADDRESS);

        address owner = recordsContract.ownerOf(newTokenData.recordId);

        require(owner == msg.sender, "INVALID: ONLY_RECORD_OWNER");
        _;
    }

    /// @dev This function sets the Owners address
    /// @param ownerAddress This is the address of new owner of contract
    function setOwnerAddress(address ownerAddress) public ownerOnly {
        OWNER = ownerAddress;
    }

    /// @dev This function sets the core treasury contract address
    /// @param ownerAddress This is the address of new core treasury contract
    function setCoreTreasuryAddress(address ownerAddress) public ownerOnly {
        TREASURY_CORE_CONTRACT_ADDRESS = ownerAddress;
    }

    /// @dev This function sets the Records Contract address
    /// @param newRecordsContractAddress This is the address of new Records contract
    function setRecordsContractAddress(address newRecordsContractAddress)
        public
        ownerOnly
    {
        RECORDS_CONTRACT_ADDRESS = newRecordsContractAddress;
    }

    /// @dev This function sets the dilution Contract address
    /// @param newDilutionContract This is the address of new dilution contract
    function setDilutionContract(address newDilutionContract) public ownerOnly {
        DILUTION_CONTRACT_ADDRESS = newDilutionContract;
    }

    /// @dev This function sets the Voting Contract address
    /// @param newVotingContractAddress This is the address of new voting contract
    function setContributionVotingContractAddress(
        address newVotingContractAddress
    ) public ownerOnly {
        CONTRIBUTION_VOTING_CONTRACT_ADDRESS = newVotingContractAddress;
    }

    /// @dev This function creates new governance tokens for specified record
    /// @param newTokenData This contains all the parameters needed to create a new governance token that are
    function createNewGovernanceToken(
        TreasuryCoreContract.NewTokenData memory newTokenData
    ) external payable canCreateToken(newTokenData) returns (uint256) {
        TreasuryCoreContract treasuryCoreContract = TreasuryCoreContract(
            TREASURY_CORE_CONTRACT_ADDRESS
        );
        return treasuryCoreContract.createNewGovernanceToken(newTokenData);
    }

    /// @dev This function creats new community tokens for specified record
    /// @param newTokenData This contains all the parameters needed to create a new community token that are
    function createNewCommunityToken(
        TreasuryCoreContract.NewTokenData memory newTokenData
    ) external payable canCreateToken(newTokenData) returns (uint256) {
        TreasuryCoreContract treasuryCoreContract = TreasuryCoreContract(
            TREASURY_CORE_CONTRACT_ADDRESS
        );
        return treasuryCoreContract.createNewCommunityToken(newTokenData);
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
        // call super method
        TreasuryCoreContract treasuryCoreContract = TreasuryCoreContract(
            TREASURY_CORE_CONTRACT_ADDRESS
        );
        treasuryCoreContract.mintTokens(recordId, tokenId, tokenAmount);
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
        TreasuryCoreContract treasuryCoreContract = TreasuryCoreContract(
            TREASURY_CORE_CONTRACT_ADDRESS
        );
        // call super method
        treasuryCoreContract.transferRewardAmount(
            to,
            recordId,
            contributionId,
            rewardGovernance,
            rewardCommunity,
            CONTRIBUTION_VOTING_CONTRACT_ADDRESS
        );
    }

    /// @dev This function gives you the community token id of the recordId that you pass
    /// @param recordId This is the Id of the token that you want to check
    function getCommunityTokenId(uint256 recordId)
        public
        view
        returns (uint256)
    {
        TreasuryCoreContract treasuryCoreContract = TreasuryCoreContract(
            TREASURY_CORE_CONTRACT_ADDRESS
        );
        (, , , , bool isPresent, uint256 tokenId) = treasuryCoreContract
            .commTokenMapping(recordId);
        if (isPresent) {
            return tokenId;
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
        TreasuryCoreContract treasuryCoreContract = TreasuryCoreContract(
            TREASURY_CORE_CONTRACT_ADDRESS
        );
        (, , , , bool isPresent, uint256 tokenId) = treasuryCoreContract
            .govTokenMapping(recordId);
        if (isPresent) {
            return tokenId;
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
        TreasuryCoreContract treasuryCoreContract = TreasuryCoreContract(
            TREASURY_CORE_CONTRACT_ADDRESS
        );
        uint256 totalCirculatingBalance = SafeMath.sub(
            treasuryCoreContract.totalSupply(tokenId),
            treasuryCoreContract.balanceOf(address(this), tokenId)
        );

        return totalCirculatingBalance;
    }

    /// @dev This function sets the symbol name as used, this function is called from records
    // contract to reserve symbol for new version creation
    /// @param governanceSymbol Symbol for governance token
    /// @param communitySymbol Symbol for community token
    function setSymbolsAsUsed(
        string memory governanceSymbol,
        string memory communitySymbol
    ) external onlyRecordsContract {
        TreasuryCoreContract treasuryCoreContract = TreasuryCoreContract(
            TREASURY_CORE_CONTRACT_ADDRESS
        );
        require(
            treasuryCoreContract.govTokenSym(governanceSymbol) == false,
            "INVALID: TOKEN_SYMBOL_ALREADY_IN_USE"
        );

        require(
            treasuryCoreContract.commTokenSym(communitySymbol) == false,
            "INVALID: TOKEN_SYMBOL_ALREADY_IN_USE"
        );
        treasuryCoreContract.setSymbolsAsUsed(
            governanceSymbol,
            communitySymbol
        );
    }

    /// @dev This function sets the symbol name as available, this function is called from records
    // contract to reserve symbol for new version creation
    /// @param governanceSymbol Symbol for governance token
    /// @param communitySymbol Symbol for community token
    function setSymbolsAsAvailable(
        string memory governanceSymbol,
        string memory communitySymbol
    ) external onlyRecordsContract {
        TreasuryCoreContract treasuryCoreContract = TreasuryCoreContract(
            TREASURY_CORE_CONTRACT_ADDRESS
        );
        treasuryCoreContract.setSymbolsAsAvailable(
            governanceSymbol,
            communitySymbol
        );
    }

    function snapshot() public returns (uint256 snapshotId) {
        TreasuryCoreContract treasuryCoreContract = TreasuryCoreContract(
            TREASURY_CORE_CONTRACT_ADDRESS
        );
        return treasuryCoreContract.snapshot();
    }

    /// @dev this function is responsible for minting of new tokens for records
    /// @param tokenId Id this is the tokenId that is to minted
    /// @param amount the amount that is to be minted
    function mintTokens(uint256 tokenId, uint256 amount)
        public
        onlyDilutionContract
    {
        TreasuryCoreContract treasuryCoreContract = TreasuryCoreContract(
            TREASURY_CORE_CONTRACT_ADDRESS
        );
        treasuryCoreContract.mint(tokenId, amount);
    }
}
