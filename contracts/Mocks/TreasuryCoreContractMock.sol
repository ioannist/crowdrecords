// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../treasury/TreasuryCoreContract.sol";

contract TreasuryCoreContractMock is TreasuryCoreContract {
    constructor(address owner) TreasuryCoreContract(owner) {}

    /// @dev This function is a mock function that will mint tokens of specific ids
    // This function can be called to mimic dilution result
    /// @param tokenId This is the id of the which is to be minted
    /// @param tokenAmount This is the amount that is to be minted
    function mintTokens(uint256 tokenId, uint256 tokenAmount) external {
        // Here minting of new tokens is done. And those are sent directly into the treasury
        _mint(
            address(this),
            tokenId,
            tokenAmount,
            "Token minted through voting process"
        );
    }

    /// @dev This function is a mock function that will mint tokens of specific ids
    // and send it to the calling user
    /// @param tokenId This is the id of the which is to be minted
    /// @param tokenAmount This is the amount that is to be minted
    function mintTokensForMe(uint256 tokenId, uint256 tokenAmount) public {
        // Here minting of new tokens is done. And those are sent directly into the treasury
        _mint(
            msg.sender,
            tokenId,
            tokenAmount,
            "Token minted through voting process"
        );
    }
}
