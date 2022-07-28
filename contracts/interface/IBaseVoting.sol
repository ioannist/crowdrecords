pragma solidity ^0.8.0;

interface IBaseVoting {
    /**
     * @dev This function will be called when either user is transferring the tokens to other account,
     or is receiving tokens from other tokens.
     * @param user address of the user whose balance is being changed
     * @param previousBalance this is the old balance of the user
     * @param newBalance this is the new balance of the user that is after the transfer
     */
    function _handleUserTokenTransfers(
        address user,
        uint256 tokenId,
        uint256 previousBalance,
        uint256 newBalance
    ) external;
}
