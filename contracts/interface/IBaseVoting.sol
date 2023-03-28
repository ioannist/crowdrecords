pragma solidity ^0.8.0;

interface IBaseVoting {
    /// @dev This function will be called when either user is transferring the tokens to other account,
    /// or is receiving tokens from other tokens.
    /// @param user address of the user whose balance is being changed
    /// @param previousBalance this is the old balance of the user
    /// @param newBalance this is the new balance of the user that is after the transfer
    function _handleUserTokenTransfers(
        address user,
        uint256 tokenId,
        uint256 previousBalance,
        uint256 newBalance
    ) external;

    /// @dev This function sets the MIN_TURN_OUT percentage
    /// @param minTurnOut This is the new turnout percentage value
    function setMinTurnOut(uint minTurnOut) external;

    /// @dev This function sets the VOTING_DEPOSIT percentage
    /// @param depositAmount This is the new turnout percentage value
    function setDepositAmount(uint depositAmount) external;

    /// @dev This function sets the VOTING_BLOCK_PERIOD percentage
    /// @param votingPeriod This is the voting period
    function setVotingPeriod(uint votingPeriod) external;
}
