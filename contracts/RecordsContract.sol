pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interface/IContribution.sol";

contract RecordsContract is Initializable {
    uint256 newTokenId = 0;
    uint256 newVersionRequestId = 0;

    // This mapping contains data of record
    mapping(uint256 => RecordStruct) public recordData;
    // This mapping contains if seed data id is being used or not
    // Same shouldn't be used to create 2 different records, unless the other record is a different
    // version of existing record
    mapping(uint256 => bool) public seedIdUsed;

    //This is mapping that holds the listing of versions that are created from a original record
    mapping(uint256 => uint256[]) public recordVersion;

    // This mapping will hold the list of contributions that are linked to a specific record
    mapping(uint256 => uint256[]) public recordContributions;

    // Address of the contribution contracts
    address public immutable CONTRIBUTION_CONTRACT_ADDRESS;

    // Address of the records voting contracts
    address public immutable RECORDS_VOTING_CONTRACT_ADDRESS;

    // Address of the controller contract
    address public CONTROLLER_CONTRACT_ADDRESS;

    // Address of the owner
    address public immutable OWNER;

    // Contribution contract
    IContribution public immutable contributionContract;

    /// @dev This struct holds the data for record token
    /// @param name Name of the record
    /// @param image This is the image of the record
    /// @param seedId This is the seed contribution id
    /// @param parentId This is the id of the parent record from which record is created
    /// @param owner Address of the owner
    /// @param recordCategory This is the record category
    /// @param creationDate This is the creation date of the record
    /// @param isPresent To check if a record os present or not
    struct RecordStruct {
        string name;
        string image;
        uint256 seedId;
        uint256 parentId;
        address owner;
        string recordCategory;
        uint256 creationDate;
        bool isPresent;
    }

    /// @dev This is the token data for new version of record
    /// @param totalSupply This is the total amount of tokens that will be created
    /// @param oldContributorShare This is the amount of token that will be distributed among the previous record owners
    /// @param userBalance Amount of tokens that user will keep to himself
    /// @param symbol Symbol for the token
    /// @param image Image for the token
    struct NewVersionTokenStruct {
        uint256 totalSupply;
        uint256 oldContributorShare;
        uint256 userBalance;
        string symbol;
        string image;
    }

    /// @param name This is the name of the record
    /// @param image This is the image/logo of the record
    /// @param recordCategory This is the category to which record belongs
    /// @param seedId This is the seed contribution id
    struct NewRecordPayload {
        string name;
        string image;
        string recordCategory;
        uint256 seedId;
    }

    /// @dev This event is emited when new record is created
    /// @param recordId This is the recordId
    /// @param name Name of the record
    /// @param image This is the image of the record
    /// @param seedId This is the seed contribution id
    /// @param parentId This is the id of the parent record from which record is created
    /// @param recordCategory This is the record category
    /// @param creationDate This is the creation date of the record
    event RecordCreated(
        uint256 recordId,
        string name,
        string image,
        uint256 seedId,
        address owner,
        uint256 parentId,
        string recordCategory,
        uint256 creationDate
    );

    constructor(
        address owner,
        address contributionContractAddress,
        address recordsVotingContract
    ) {
        OWNER = owner;
        CONTRIBUTION_CONTRACT_ADDRESS = contributionContractAddress;
        RECORDS_VOTING_CONTRACT_ADDRESS = recordsVotingContract;
        contributionContract = IContribution(CONTRIBUTION_CONTRACT_ADDRESS);
    }

    /// @dev This is to set the address of the contracts
    /// @param controllerContractAddress this is the address of controller contract
    function initialize(
        address controllerContractAddress
    ) public initializer onlyOwner {
        CONTROLLER_CONTRACT_ADDRESS = controllerContractAddress;
    }

    /// @dev Modifier to check that the function is only being called from the contribution contract
    modifier onlyOwner() {
        require(msg.sender == OWNER, "UNAUTHORIZED: ONLY_OWNER");
        _;
    }

    /// @dev Modifier to check that the function is only being called from the contribution contract
    modifier onlyContributionContract() {
        require(
            msg.sender == CONTRIBUTION_CONTRACT_ADDRESS,
            "UNAUTHORIZED: ONLY_CONTRIBUTION_CONTRACT"
        );
        _;
    }

    /// @dev Modifier to check that the function is only being called from the contribution contract
    modifier onlyRecordsVotingContract() {
        require(
            msg.sender == RECORDS_VOTING_CONTRACT_ADDRESS,
            "UNAUTHORIZED: ONLY_RECORDS_VOTING_CONTRACT_ADDRESS"
        );
        _;
    }

    /// @dev Modifier to check that the function is only being called from the controller contract
    modifier onlyControllerContract() {
        require(
            msg.sender == CONTROLLER_CONTRACT_ADDRESS,
            "UNAUTHORIZED: ONLY_CONTROLLER_CONTRACT"
        );
        _;
    }

    /// @dev This function creates new record
    /// @param payload this is the record payload
    /// @param owner this is the owner of the record
    function controllerCreateNewRecord(
        NewRecordPayload memory payload,
        address owner
    ) public onlyControllerContract returns (uint256) {
        return
            _createNewRecord(
                payload.name,
                payload.image,
                payload.recordCategory,
                payload.seedId,
                owner
            );
    }

    /// @dev This function creates new record, this function can be called by anyone
    /// @param payload this is the record payload
    /// @param platformWallet this is the UI providers wallet
    /// @param platformFee this is the incentive amount for the UI maintainer
    function createNewRecord(
        NewRecordPayload memory payload,
        address payable platformWallet,
        uint256 platformFee
    ) public payable returns (uint256) {
        require(msg.value >= platformFee, "INV: INSUFFICIENT_PLATFORM_FEE");
        if (msg.value > 0) {
            platformWallet.call{value: platformFee}("");
        }

        require(
            seedIdUsed[payload.seedId] == false,
            "INVALID: SEED_ALREADY_USED"
        );

        IContribution.Contribution memory contribution = contributionContract
            .getContributionData(payload.seedId);

        require(
            contribution.isPresent == true,
            "INVALID: CONTRIBUTION_NOT_FOUND"
        );

        require(
            contribution.seedContribution == true,
            "INVALID: NOT_SEED_CONTRIBUTION"
        );

        require(
            contribution.owner == msg.sender,
            "INVALID: ONLY_CONTRIBUTION_OWNER"
        );

        return
            _createNewRecord(
                payload.name,
                payload.image,
                payload.recordCategory,
                payload.seedId,
                msg.sender
            );
    }

    /// @dev This function creates new record, this function is to be called only from within contract
    /// @param name This is the name of the record
    /// @param image This is the image/logo of the record
    /// @param recordCategory This is the category to which record belongs
    /// @param seedId This is the seed contribution id
    function _createNewRecord(
        string memory name,
        string memory image,
        string memory recordCategory,
        uint256 seedId,
        address owner
    ) internal returns (uint256) {
        newTokenId++;
        uint256 recordId = newTokenId;

        RecordStruct memory recordStruct = RecordStruct({
            name: name,
            image: image,
            seedId: seedId,
            parentId: 0,
            owner: owner,
            recordCategory: recordCategory,
            creationDate: block.timestamp,
            isPresent: true
        });

        recordData[recordId] = recordStruct;
        recordContributions[recordId].push(seedId);

        emit RecordCreated({
            recordId: recordId,
            name: name,
            image: image,
            seedId: seedId,
            owner: owner,
            parentId: 0,
            recordCategory: recordCategory,
            creationDate: recordStruct.creationDate
        });

        seedIdUsed[seedId] = true;

        return (recordId);
    }

    /// @dev This function pushes a contribution into the array of the record
    /// @param recordId This is the recordId to which contribution is to be added
    /// @param contributionId This is the contribution id to push in array
    function pushContributionIdToContributionList(
        uint256 recordId,
        uint256 contributionId
    ) external onlyContributionContract {
        recordContributions[recordId].push(contributionId);
    }

    /// @dev This function return the address of record owner
    /// @param recordId This is the recordId whose owner you want
    function ownerOf(uint256 recordId) external returns (address) {
        return recordData[recordId].owner;
    }

    /// @dev This function will create new record version from existing record
    /// @param oldRecordId This is the id of the old record
    /// @param name The name of the record
    /// @param image This is the image link for the record cover
    /// @param recordCategory Record category in string
    /// @param caller The owner / user who called this function
    /// @param ballotId The Id of the voting ballot
    function createNewRecordVersion(
        uint256 oldRecordId,
        string memory name,
        string memory image,
        string memory recordCategory,
        address caller,
        uint256 ballotId
    )
        public
        onlyRecordsVotingContract
        returns (RecordsContract.RecordStruct memory)
    {
        RecordStruct memory sourceVersion = recordData[oldRecordId];
        RecordStruct memory recordStruct = RecordStruct({
            name: name,
            image: image,
            seedId: sourceVersion.seedId,
            parentId: oldRecordId,
            owner: caller,
            recordCategory: recordCategory,
            creationDate: block.timestamp,
            isPresent: true
        });

        return (recordStruct);
    }

    /// @dev This function is to be called only form voting contract, and it creates new record
    /// @param newRecordData This is the record data
    /// @param contributionIds Array of the contribution id
    function createRecordFromData(
        RecordStruct memory newRecordData,
        uint256[] memory contributionIds
    ) external onlyRecordsVotingContract returns (uint256) {
        newTokenId++;
        uint256 recordId = newTokenId;

        recordData[recordId] = newRecordData;
        recordContributions[recordId] = contributionIds;
        recordContributions[recordId].push(newRecordData.seedId);
        recordVersion[newRecordData.parentId].push(recordId);

        emit RecordCreated({
            recordId: recordId,
            name: newRecordData.name,
            image: newRecordData.image,
            seedId: newRecordData.seedId,
            owner: msg.sender,
            parentId: newRecordData.parentId,
            recordCategory: newRecordData.recordCategory,
            creationDate: newRecordData.creationDate
        });
        return recordId;
    }

    /// dev This function is to be called only form voting contract, and it creates new record
    /// param newRecordData This is the record data
    /// param contributionIds Array of the contribution id
    function validateNewRecordVersionParams(
        uint256 oldVersionId,
        uint256 govTokenTotalSupply,
        uint256 govTokenOwnerBalanace,
        uint256 commTokenTotalSupply,
        uint256 commTokenOwnerBalanace
    ) external view returns (bool) {
        require(
            recordData[oldVersionId].isPresent,
            "INVALID: RECORD_NOT_FOUND"
        );

        require(
            govTokenTotalSupply >= govTokenOwnerBalanace &&
                commTokenTotalSupply >= commTokenOwnerBalanace,
            "INVALID: USER_BALANCE_MORE_THAN_SUPPLY"
        );
        return true;
    }
}
