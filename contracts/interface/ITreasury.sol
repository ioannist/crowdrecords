pragma solidity ^0.8.0;

interface ITreasury {
    struct Token {
        uint256 recordId;
        string symbol;
        string image;
        uint256 creationDate;
        bool isPresent;
        uint256 tokenId;
    }

    struct NewTokenData {
        uint256 recordId;
        uint256 totalSupply;
        uint256 userBalance;
        string symbol;
        string image;
    }

    /**
     * @dev This function sets the Records Contract address
     */
    function setRecordsContractAddress(address newRecordsContractAddress)
        external;

    /**
     * @dev This function sets the Voting Contract address
     */
    function setContributionVotingContractAddress(
        address newVotingContractAddress
    ) external;

    /**
     * @dev This function creats new governance tokens for specified record
     * @param newTokenData This contains all the parameters needed to create a new governance token that are
     * - recordId This is the recordId that for new token
     * - totalSupply This is the total supply of governance token
     * - userBalance This is the amount of tokens that user wants to keep to himself
     * - symbol This is the symbol of the gvernance token
     * - image this is image of the gov token.
     */
    function createNewGovernanceToken(NewTokenData memory newTokenData)
        external
        payable
        returns (uint256);

    /**
     * @dev This function creats new community tokens for specified record
     * @param newTokenData This contains all the parameters needed to create a new community token that are
     * - recordId This is the recordId that for new token
     * - totalSupply This is the total supply of community token
     * - userBalance This is the amount of tokens that user wants to keep to himself
     * - symbol This is the symbol of the community token
     * - image this is image of the gov token.
     */
    function createNewCommunityToken(NewTokenData memory newTokenData)
        external
        payable
        returns (uint256);

    /**
     * @dev This function creats new community tokens for specified record
     * @param recordId This is the id of the record to which the token belongs to
     * @param tokenId This is the id of the which is to be minted
     * @param tokenAmount This is the amount that is to be minted
     */
    function mintTokens(
        uint256 recordId,
        uint256 tokenId,
        uint256 tokenAmount
    ) external payable;

    /**
     * @dev This function is called only by the voting contract once the voting ends
     * @param to This is the recivers address
     * @param recordId This is the recordId to which the contribution belongs to
     * @param contributionId this is the contribution id to which the user has won
     * @param rewardGovernance this is the amout of Governance token that needs to be transfered
     * @param rewardCommunity this is the amout of comunity token that needs to be transfered
     */
    function transferRewardAmount(
        address to,
        uint256 recordId,
        uint256 contributionId,
        uint256 rewardGovernance,
        uint256 rewardCommunity
    ) external payable;

    /**
     * @dev This function gives you the community token id of the recordId that you pass
     * @param recordId This is the Id of the token that you want to check
     */
    function getCommunityTokenId(uint256 recordId)
        external
        view
        returns (uint256);

    /**
     * @dev This function gives you the governance token id of the recordId that you pass
     * @param recordId This is the Id of the token that you want to check
     */
    function getGovernanceTokenId(uint256 recordId)
        external
        view
        returns (uint256);

    /**
     * @dev This function returns the amount of total tokens that are in circulation
     * @param tokenId This is the token whoes circulating supply you  want to find out
     */
    function totalCirculatingSupply(uint256 tokenId)
        external
        view
        returns (uint256);

    function snapshot() external returns (uint256 snapshotId);

    function balanceOf(address account, uint256 snapshotId)
        external
        view
        returns (uint256);
}
