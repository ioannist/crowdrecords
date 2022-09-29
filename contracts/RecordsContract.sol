pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interface/IContribution.sol";

contract RecordsContract {
    uint256 newTokenId = 0;

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

    // Address of the owner of the contracts
    address public OWNER;
    address public CONTRIBUTION_CONTRACT_ADDRESS;

    /// @dev This struct holds the data for record token
    /// @param name Name of the record
    /// @param image This is the image of the record
    /// @param seedId This is the seed contribution id
    /// @param parentId This is the id of the parent record from which record is created
    /// @param owner Address of the owner
    /// @param recordCategory This is the record category
    /// @param creationDate This is the creation date of the record
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

    /// @dev Modifier to check that the person who accesses a specific function is the owner of contract himself.
    modifier ownerOnly() {
        require(msg.sender == OWNER, "UNAUTHORIZED: CANNOT_PERFORM_ACTION");
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

    /// @dev This function sets the owner address
    /// @param ownerAddress Takes the address of new owner as parameter
    function setOwnerAddress(address ownerAddress) public ownerOnly {
        OWNER = ownerAddress;
    }

    /// @dev This function sets the contribution Contract address
    /// @param contributionContractAddress Takes the address of new contribution contract as parameter
    function setContributionContractAddress(address contributionContractAddress)
        public
        ownerOnly
    {
        CONTRIBUTION_CONTRACT_ADDRESS = contributionContractAddress;
    }

    /// @dev This function sets the Treasury Contract address
    /// @param treasuryContractAddress Takes the address of new treasury contract as parameter
    function setTreasuryContractAddress(address treasuryContractAddress)
        public
        _ownerOnly
    {
        _setTreasuryContractAddress(treasuryContractAddress);
    }

    /// @dev This function sets the Treasury Contract address
    /// @param treasuryCoreContractAddress Takes the address of new treasury core contract as parameter
    function setTreasuryCoreContractAddress(address treasuryCoreContractAddress)
        public
        _ownerOnly
    {
        TREASURY_CORE_CONTRACT_ADDRESS = treasuryCoreContractAddress;
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

    // create new version,
    // take existing records id,
    // The seed will stay same
    // The contributions id is selected by user,
    // New clone contributions are created,
    // create voting for the token distribution,
    // wait for result - generate tokens
}
