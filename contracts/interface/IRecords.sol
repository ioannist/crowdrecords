pragma solidity ^0.8.0;

interface IRecords {
    /// @dev This function sets the owner address
    /// @param ownerAddress Takes the address of new owner as parameter
    function setOwnerAddress(address ownerAddress) external;

    /// @dev This function sets the contribution Contract address
    /// @param contributionContractAddress Takes the address of new contribution contract as parameter
    function setContributionContractAddress(address contributionContractAddress)
        external;

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
    ) external;

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
}
