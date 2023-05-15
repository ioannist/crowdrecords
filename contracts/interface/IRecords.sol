pragma solidity ^0.8.0;

interface IRecords {
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

    struct NewRecordPayload {
        string name;
        string image;
        string recordCategory;
        uint256 seedId;
    }

    /// @dev This function sets the owner address
    /// @param ownerAddress Takes the address of new owner as parameter
    function setOwnerAddress(address ownerAddress) external;

    /// @dev This function sets the contribution Contract address
    /// @param contributionContractAddress Takes the address of new contribution contract as parameter
    function setContributionContractAddress(
        address contributionContractAddress
    ) external;

    /// @dev This function creates new record, this function can be called by anyone
    /// @param payload this is the record payload
    /// @param platformWallet this is the UI providers wallet
    /// @param platformFee this is the incentive amount for the UI maintainer
    function createNewRecord(
        NewRecordPayload memory payload,
        address payable platformWallet,
        uint256 platformFee
    ) external;

    /// @dev This function creates new record
    /// @param payload this is the record payload
    /// @param owner this is the owner of the record
    function controllerCreateNewRecord(
        NewRecordPayload memory payload,
        address owner
    ) external returns (uint256);

    /// @dev This function pushes a contribution into the array of the record
    /// @param recordId This is the recordId to which contribution is to be added
    /// @param contributionId This is the contribution id to push in array
    function pushContributionIdToContributionList(
        uint256 recordId,
        uint256 contributionId
    ) external;

    /// @dev This function return the address of record owner
    /// @param recordId This is the recordId whose owner you want
    function ownerOf(uint256 recordId) external returns (address);

    /// @dev This function return the id of CRD token
    function newVersionRequestMap(
        uint256 index
    )
        external
        view
        returns (
            RecordStruct memory recordData,
            NewVersionTokenStruct memory governanceToken,
            NewVersionTokenStruct memory communityToken,
            address requester,
            uint256 oldVersionId,
            uint256 tokenId,
            uint256 ballotId,
            bool isPresent,
            bool isAccepted
        );
}
