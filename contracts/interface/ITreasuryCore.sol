pragma solidity ^0.8.0;

interface ITreasuryCore {
    /// @dev This function return the id of CRD token
    /// @return tokenId it is the ID of CRD token
    function CRD() external view returns (uint256);

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

    /// @dev Transfers `amount` tokens of token type `id` from `from` to `to`.
    /// @param to It is the token receivers address
    /// @param from from is the sender address.
    /// @param id `from` must have a balance of tokens of type `id` of at least `amount`.
    /// @param amount this is the amount to transfer
    /// @param data This is the data or note for transfer
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external;

    function balanceOf(
        address account,
        uint256 tokenId
    ) external view returns (uint256);

    /// @dev Retrieves the balance of `account` at the time `snapshotId` was created.
    function balanceOfAt(
        address account,
        uint256 snapshotId,
        uint256 tokenId
    ) external view returns (uint256);

    /// @dev This function creates new governance tokens for specified record
    /// @param newTokenData This contains all the parameters needed to create a new governance token that are
    /// @param userAddress - This is the address of the user who is the creator of the token
    function createNewGovernanceToken(
        NewTokenData memory newTokenData,
        address userAddress
    ) external returns (uint256);

    /// @dev This function creates new community tokens for specified record
    /// @param newTokenData This contains all the parameters needed to create a new community token that are
    /// @param userAddress - This is the address of the user who is the creator of the token
    function createNewCommunityToken(
        NewTokenData memory newTokenData,
        address userAddress
    ) external returns (uint256);
}
