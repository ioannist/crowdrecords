pragma solidity ^0.8.0;

interface ITreasury {
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

    /// @dev This function sets the Records Contract address
    function setRecordsContractAddress(address newRecordsContractAddress)
        external;

    /// @dev This function sets the Voting Contract address
    function setContributionVotingContractAddress(
        address newVotingContractAddress
    ) external;

    /// @dev This function creates new governance tokens for specified record. Only call from records contract
    function createNewGovernanceTokenNewRecordVersion(
        uint256 recordId,
        uint256 totalSupply,
        uint256 userBalance,
        string memory symbol,
        string memory image,
        uint256 tokensForOldContributors,
        address userAddress
    ) external payable returns (uint256);

    /// @dev This function creates new governance tokens for specified record. Only call from records contract
    function createNewCommunityTokenNewRecordVersion(
        uint256 recordId,
        uint256 totalSupply,
        uint256 userBalance,
        string memory symbol,
        string memory image,
        uint256 tokensForOldContributors,
        address userAddress
    ) external payable returns (uint256);

    /// @dev This function creats new governance tokens for specified record
    /// @param newTokenData This contains all the parameters needed to create a new governance token that are
    /// @param userAddress - This is the address of the user who is the creator of the token
    function createNewGovernanceToken(
        NewTokenData memory newTokenData,
        address userAddress
    ) external payable returns (uint256);

    /// @dev This function creats new community tokens for specified record
    /// @param newTokenData This contains all the parameters needed to create a new community token that are
    /// @param userAddress - This is the address of the user who is the creator of the token
    function createNewCommunityToken(
        NewTokenData memory newTokenData,
        address userAddress
    ) external payable returns (uint256);

    /// @dev this function is responsible for minting of new tokens for records
    /// @param tokenId Id this is the tokenId that is to minted
    /// @param amount the amount that is to be minted
    function mintTokens(uint256 tokenId, uint256 amount) external payable;

    /// @dev This function creates new community tokens for specified record
    /// @param recordId This is the id of the record to which the token belongs to
    /// @param tokenId This is the id of the which is to be minted
    /// @param tokenAmount This is the amount that is to be minted
    function mintTokens(
        uint256 recordId,
        uint256 tokenId,
        uint256 tokenAmount
    ) external payable;

    /// @dev This function is called only by the voting contract once the voting ends
    /// @param to This is the receivers address
    /// @param recordId This is the recordId to which the contribution belongs to
    /// @param contributionId this is the contribution id to which the user has won
    /// @param rewardGovernance this is the amount of Governance token that needs to be transfered
    /// @param rewardCommunity this is the amount of community token that needs to be transfered
    function transferRewardAmount(
        address to,
        uint256 recordId,
        uint256 contributionId,
        uint256 rewardGovernance,
        uint256 rewardCommunity
    ) external payable;

    /// @dev This function gives you the community token id of the recordId that you pass
    /// @param recordId This is the Id of the token that you want to check
    function getCommunityTokenId(uint256 recordId)
        external
        view
        returns (uint256);

    /// @dev This function gives you the governance token id of the recordId that you pass
    /// @param recordId This is the Id of the token that you want to check
    function getGovernanceTokenId(uint256 recordId)
        external
        view
        returns (uint256);

    /// @dev This function returns the amount of total tokens that are in circulation
    /// @param tokenId This is the token whoes circulating supply you  want to find out
    function totalCirculatingSupply(uint256 tokenId)
        external
        view
        returns (uint256);

    /// @dev This function creates a snapshot of current state of values and returns the id of the current snapshot
    /// @return snapshotId This is the id of the snapshot that was created just now
    function snapshot() external returns (uint256 snapshotId);

    function balanceOf(address account, uint256 tokenId)
        external
        view
        returns (uint256);

    /// @dev This function sets the symbol name as used, this function is called from records
    // contract to reserve symbol for new version creation
    /// @param governanceSymbol Symbol for governance token
    /// @param communitySymbol Symbol for community token
    function setSymbolsAsUsed(
        string memory governanceSymbol,
        string memory communitySymbol
    ) external;

    /// @dev This function sets the symbol name as available, this function is called from records
    // contract to reserve symbol for new version creation
    /// @param governanceSymbol Symbol for governance token
    /// @param communitySymbol Symbol for community token
    function setSymbolsAsAvailable(
        string memory governanceSymbol,
        string memory communitySymbol
    ) external;
}
