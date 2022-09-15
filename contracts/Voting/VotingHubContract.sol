// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interface/ITreasury.sol";
import "../interface/IBaseVoting.sol";

contract VotingHubContract {
    address[] public VOTING_CONTRACTS_ADDRESS;
    address public TREASURY_CONTRACT_ADDRESS;
    address public OWNER;

    constructor(address owner) {
        OWNER = owner;
    }

    /// @notice
    /// @dev This modifier checks that only owner fo the contracts can call the functions
    modifier _ownerOnly() {
        require(msg.sender == OWNER, "UNAUTHORIZED: LACKS_PERMISSION");
        _;
    }

    /// @notice
    /// @dev This modifier checks that only treasury can call the functions
    modifier _onlyTreasury() {
        require(
            msg.sender == TREASURY_CONTRACT_ADDRESS,
            "UNAUTHORIZED: ONLY_TREASURY_CONTRACT"
        );
        _;
    }

    /// @notice This function is to set the owner address
    /// @dev This function takes in the address of new owner and sets it to the contract
    /// @param owner Takes the address of new owner as parameter
    function setOwner(address owner) public _ownerOnly {
        OWNER = owner;
    }

    /// @notice this
    /// @dev This function will be called when either user is transferring the tokens to other account,
    /// or is receiving tokens from other tokens.
    /// @param sender address of the sender
    /// @param receiver address of the receiver
    /// @param amount the amount that is being transferred
    /// @param tokenId the id of the token that is being transferred
    function handleUserTokenTransfers(
        address sender,
        address receiver,
        uint256 amount,
        uint256 tokenId
    ) public _onlyTreasury {
        ITreasury iTreasury = ITreasury(TREASURY_CONTRACT_ADDRESS);
        for (uint256 i = 0; i < VOTING_CONTRACTS_ADDRESS.length; i++) {
            IBaseVoting iBaseVoting = IBaseVoting(VOTING_CONTRACTS_ADDRESS[i]);
            if (sender != address(0)) {
                uint256 bal = iTreasury.balanceOf(sender, tokenId);
                iBaseVoting._handleUserTokenTransfers(
                    sender,
                    tokenId,
                    bal,
                    bal - amount
                );
            }
            if (receiver != address(0)) {
                uint256 bal = iTreasury.balanceOf(receiver, tokenId);
                iBaseVoting._handleUserTokenTransfers(
                    receiver,
                    tokenId,
                    bal,
                    bal + amount
                );
            }
        }
    }

    /// @notice
    /// @dev This function sets the treasury Contract address
    function setTreasuryContractAddress(address newTreasuryContractAddress)
        public
        _ownerOnly
    {
        TREASURY_CONTRACT_ADDRESS = newTreasuryContractAddress;
    }

    /// @notice
    /// @dev This function will be called when either user is transferring the tokens to other account,
    /// or is receiving tokens from other tokens.
    /// @param contractAddress address of the voting contract
    function addVotingContract(address contractAddress) public _ownerOnly {
        VOTING_CONTRACTS_ADDRESS.push(contractAddress);
    }

    /// @notice
    /// @dev This function will be called when either user is transferring the tokens to other account,
    /// or is receiving tokens from other tokens.
    /// @param index index of the contract to remove from the list
    function removeVotingContract(uint256 index) public _ownerOnly {
        require(
            index < VOTING_CONTRACTS_ADDRESS.length,
            "INVALID: INCORRECT_INDEX"
        );
        VOTING_CONTRACTS_ADDRESS[index] = VOTING_CONTRACTS_ADDRESS[
            VOTING_CONTRACTS_ADDRESS.length - 1
        ];
        VOTING_CONTRACTS_ADDRESS.pop();
    }
}
