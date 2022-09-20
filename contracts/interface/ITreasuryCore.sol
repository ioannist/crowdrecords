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
}
