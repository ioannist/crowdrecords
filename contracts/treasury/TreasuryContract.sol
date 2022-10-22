pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../ERC1155/SnapshotERC1155.sol";
import "../interface/IRecords.sol";
import "../voting/VotingHubContract.sol";
import "./TreasuryCoreContract.sol";

contract TreasuryContract is Initializable {
    uint256 public constant CRD = 1;
    address public OWNER;
    address public RECORDS_CONTRACT_ADDRESS;
    address public RECORDS_VOTING_CONTRACT_ADDRESS;
    address public CONTRIBUTION_VOTING_CONTRACT_ADDRESS;
    address public DILUTION_CONTRACT_ADDRESS;
    address public TREASURY_CORE_CONTRACT_ADDRESS;

    address[] public SNAPSHOT_CALLER;

    constructor(address owner) {
        OWNER = owner;
    }

    /// @dev Modifier to check that the person who accesses a specific function is the owner of contract himself.
    modifier ownerOnly() {
        require(msg.sender == OWNER, "UNAUTHORIZED: CANNOT_PERFORM_ACTION");
        _;
    }

    /// @dev Modifier to check that the calls are made by records contract only
    modifier onlyRecordsVotingContract() {
        require(
            msg.sender == RECORDS_VOTING_CONTRACT_ADDRESS,
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

    /// @dev Modifier to check that if the sender is the dilution contract or not.
    modifier onlySnapshotCaller() {
        bool validCall = false;
        for (uint256 i; i < SNAPSHOT_CALLER.length; i++) {
            if (msg.sender == SNAPSHOT_CALLER[i]) {
                validCall = true;
            }
        }
        if (validCall) {
            _;
        } else {
            revert("UNAUTHORIZED: ONLY_SNAPSHOT_CALLERS");
        }
    }

    /// @dev This function is called to give a address privilege to call snapshot function
    /// @param contractAddress address of the voting contract
    function addSnapshotCaller(address contractAddress) public ownerOnly {
        SNAPSHOT_CALLER.push(contractAddress);
    }

    /// @notice
    /// @dev This function invokes the snapshot calling privilages
    /// @param index index of the contract to remove from the list
    function removeSnapshotCaller(uint256 index) public ownerOnly {
        require(index < SNAPSHOT_CALLER.length, "INVALID: INCORRECT_INDEX");
        SNAPSHOT_CALLER[index] = SNAPSHOT_CALLER[SNAPSHOT_CALLER.length - 1];
        SNAPSHOT_CALLER.pop();
    }

    /// @dev This function sets the Owners address
    /// @param ownerAddress This is the address of new owner of contract
    function setOwnerAddress(address ownerAddress) public ownerOnly {
        OWNER = ownerAddress;
    }

    /// @dev This is to set the address of the contracts
    /// @param newTreasuryCoreContractAddress address of treasury core contract
    /// @param newRecordsContractAddress address of records contract
    /// @param newRecordsVotingContractAddress address of record voting contract
    /// @param newDilutionContract This is the address of new dilution contract
    /// @param newVotingContractAddress This is the address of new voting contract
    function initialize(
        address newTreasuryCoreContractAddress,
        address newRecordsContractAddress,
        address newRecordsVotingContractAddress,
        address newDilutionContract,
        address newVotingContractAddress
    ) public initializer ownerOnly {
        TREASURY_CORE_CONTRACT_ADDRESS = newTreasuryCoreContractAddress;
        RECORDS_CONTRACT_ADDRESS = newRecordsContractAddress;
        RECORDS_VOTING_CONTRACT_ADDRESS = newRecordsVotingContractAddress;
        DILUTION_CONTRACT_ADDRESS = newDilutionContract;
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
        (, , , , bool isPresent, ) = treasuryCoreContract.govTokenMapping(
            newTokenData.recordId
        );
        require(isPresent == false, "INVALID: TOKEN_ID_ALREADY_IN_USE");

        bool isSymbolInUse = treasuryCoreContract.govTokenSym(
            newTokenData.symbol
        );
        require(isSymbolInUse == false, "INVALID: TOKEN_SYMBOL_ALREADY_IN_USE");
        return
            treasuryCoreContract.createNewGovernanceToken(
                newTokenData,
                tx.origin
            );
    }

    /// @dev This function creats new community tokens for specified record, this function should only be called by the owner of the record
    /// @param newTokenData This contains all the parameters needed to create a new community token that are
    function createNewCommunityToken(
        TreasuryCoreContract.NewTokenData memory newTokenData
    ) external payable canCreateToken(newTokenData) returns (uint256) {
        TreasuryCoreContract treasuryCoreContract = TreasuryCoreContract(
            TREASURY_CORE_CONTRACT_ADDRESS
        );
        (, , , , bool isPresent, ) = treasuryCoreContract.govTokenMapping(
            newTokenData.recordId
        );
        require(isPresent == false, "INVALID: TOKEN_ID_ALREADY_IN_USE");

        bool isSymbolInUse = treasuryCoreContract.govTokenSym(
            newTokenData.symbol
        );
        require(isSymbolInUse == false, "INVALID: TOKEN_SYMBOL_ALREADY_IN_USE");
        return
            treasuryCoreContract.createNewCommunityToken(
                newTokenData,
                tx.origin
            );
    }

    /// @dev This function should be only called from the records contract, this function creates
    // governance tokens when the result for a new version request is declared
    /// @param recordId Record id of which the tokens need to be created
    /// @param totalSupply This is the total supply of the token
    /// @param userBalance The amount of tokens that owner of the new version will receive
    /// @param symbol This is the short abbreviation of the token
    /// @param image This is the logo of the token
    /// @param tokensForOldContributors This is the amount of tokens that old record owners will get
    /// @param userAddress This is the address of the owner who is minting the token
    function createNewGovernanceTokenNewRecordVersion(
        uint256 recordId,
        uint256 totalSupply,
        uint256 userBalance,
        string memory symbol,
        string memory image,
        uint256 tokensForOldContributors,
        address userAddress
    ) external payable onlyRecordsVotingContract returns (uint256) {
        TreasuryCoreContract treasuryCoreContract = TreasuryCoreContract(
            TREASURY_CORE_CONTRACT_ADDRESS
        );
        TreasuryCoreContract.NewTokenData
            memory newTokenData = TreasuryCoreContract.NewTokenData(
                recordId,
                totalSupply,
                userBalance,
                symbol,
                image
            );
        uint256 tokenId = treasuryCoreContract.createNewGovernanceToken(
            newTokenData,
            userAddress
        );
        treasuryCoreContract.transferRewardTokens(
            tokenId,
            tokensForOldContributors,
            RECORDS_VOTING_CONTRACT_ADDRESS
        );
        return tokenId;
    }

    /// @dev This function should be only called from the records contract, this function creates
    // governance tokens when the result for a new version request is declared
    /// @param recordId Record id of which the tokens need to be created
    /// @param totalSupply This is the total supply of the token
    /// @param userBalance The amount of tokens that owner of the new version will receive
    /// @param symbol This is the short abbreviation of the token
    /// @param image This is the logo of the token
    /// @param tokensForOldContributors This is the amount of tokens that old record owners will get
    /// @param userAddress This is the address of the owner who is minting the token
    function createNewCommunityTokenNewRecordVersion(
        uint256 recordId,
        uint256 totalSupply,
        uint256 userBalance,
        string memory symbol,
        string memory image,
        uint256 tokensForOldContributors,
        address userAddress
    ) external payable onlyRecordsVotingContract returns (uint256) {
        TreasuryCoreContract treasuryCoreContract = TreasuryCoreContract(
            TREASURY_CORE_CONTRACT_ADDRESS
        );
        TreasuryCoreContract.NewTokenData
            memory newTokenData = TreasuryCoreContract.NewTokenData(
                recordId,
                totalSupply,
                userBalance,
                symbol,
                image
            );
        uint256 tokenId = treasuryCoreContract.createNewCommunityToken(
            newTokenData,
            userAddress
        );
        treasuryCoreContract.transferRewardTokens(
            tokenId,
            tokensForOldContributors,
            RECORDS_VOTING_CONTRACT_ADDRESS
        );
        return tokenId;
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
            rewardCommunity
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
            treasuryCoreContract.balanceOf(
                TREASURY_CORE_CONTRACT_ADDRESS,
                tokenId
            )
        );

        return totalCirculatingBalance;
    }

    /// @dev This function returns the amount of total tokens that are in circulation
    /// @param tokenId This is the token whose circulating supply you  want to find out
    function balanceOf(address account, uint256 tokenId)
        public
        view
        returns (uint256)
    {
        TreasuryCoreContract treasuryCoreContract = TreasuryCoreContract(
            TREASURY_CORE_CONTRACT_ADDRESS
        );

        return treasuryCoreContract.balanceOf(account, tokenId);
    }

    /// @dev This function sets the symbol name as used, this function is called from records
    // contract to reserve symbol for new version creation
    /// @param governanceSymbol Symbol for governance token
    /// @param communitySymbol Symbol for community token
    function setSymbolsAsUsed(
        string memory governanceSymbol,
        string memory communitySymbol
    ) external onlyRecordsVotingContract {
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
    ) external onlyRecordsVotingContract {
        TreasuryCoreContract treasuryCoreContract = TreasuryCoreContract(
            TREASURY_CORE_CONTRACT_ADDRESS
        );
        treasuryCoreContract.setSymbolsAsAvailable(
            governanceSymbol,
            communitySymbol
        );
    }

    function snapshot() public onlySnapshotCaller returns (uint256 snapshotId) {
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
