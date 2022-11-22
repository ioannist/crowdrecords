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
    address public CONTRIBUTION_CONTRACT_ADDRESS;

    // Address of the records voting contracts
    address public RECORDS_VOTING_CONTRACT_ADDRESS;

    // Address of the owner
    address public OWNER;

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
        uint256 parentId,
        string recordCategory,
        uint256 creationDate
    );

    constructor(address owner) {
        OWNER = owner;
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

    /// @dev This is to set the address of the contracts
    /// @param contributionContractAddress Takes the address of new contribution contract as parameter
    /// @param recordsVotingContract Takes the address of new voting contract as parameter
    function initialize(
        address contributionContractAddress,
        address recordsVotingContract
    ) public initializer onlyOwner {
        CONTRIBUTION_CONTRACT_ADDRESS = contributionContractAddress;
        RECORDS_VOTING_CONTRACT_ADDRESS = recordsVotingContract;
    }

    /// @dev This function creates new record
    /// @param name This is the name of the record
    /// @param image This is the image/logo of the record
    /// @param recordCategory This is the category to which record belongs
    /// @param seedId This is the seed contribution id
    function createNewRecord(
        string memory name,
        string memory image,
        string memory recordCategory,
        uint256 seedId
    ) public returns (uint256 recordId) {
        newTokenId++;
        uint256 recordId = newTokenId;

        require(seedIdUsed[seedId] == false, "INVALID: SEED_ALREADY_USED");

        IContribution contributionContract = IContribution(
            CONTRIBUTION_CONTRACT_ADDRESS
        );

        IContribution.Contribution memory contribution = contributionContract
            .getContributionData(seedId);

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

        RecordStruct memory recordStruct = RecordStruct({
            name: name,
            image: image,
            seedId: seedId,
            parentId: 0,
            owner: msg.sender,
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
    ) external returns (bool) {
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
