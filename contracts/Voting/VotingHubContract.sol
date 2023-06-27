// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interface/ITreasuryCore.sol";
import "../interface/IBaseVoting.sol";

contract VotingHubContract {
    address[] public VOTING_CONTRACTS_ADDRESS;
    address public TREASURY_CORE_CONTRACT_ADDRESS;
    address public OWNER;
    ITreasuryCore public iTreasury;

    event VotingContractAdded(address votingContractAddress);

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
    modifier _onlyTreasuryCore() {
        require(
            msg.sender == TREASURY_CORE_CONTRACT_ADDRESS,
            "UNAUTHORIZED: ONLY_TREASURY_CORE_CONTRACT"
        );
        _;
    }

    // @notice Checks if an address is a smart contract.
    // @dev This function uses assembly code to access the extcodesize opcode,
    //   which returns the size of the code stored at an address.
    //   If the size is greater than zero, the address is a contract.
    //   This check will fail for contracts that are in the process of being created but have not yet been mined.
    // @param _address Address to be checked.
    // @return If the address is a contract, the function proceeds. Otherwise, it throws an error.
    modifier isContract(address _address) {
        uint32 size;
        assembly {
            size := extcodesize(_address)
        }
        require(size > 0, "INVALID: ONLY_CONTRACT_CAN_BE_ADDED");
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
    ) public _onlyTreasuryCore {
        for (uint256 i = 0; i < VOTING_CONTRACTS_ADDRESS.length; i++) {
            IBaseVoting iBaseVoting = IBaseVoting(VOTING_CONTRACTS_ADDRESS[i]);
            if (sender != address(0)) {
                uint256 bal = iTreasury.balanceOf(sender, tokenId);
                require(
                    bal >= amount,
                    "ERC1155: insufficient balance for transfer"
                );
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
    function setTreasuryCoreContractAddress(
        address newTreasuryContractAddress
    ) public _ownerOnly {
        TREASURY_CORE_CONTRACT_ADDRESS = newTreasuryContractAddress;
        iTreasury = ITreasuryCore(TREASURY_CORE_CONTRACT_ADDRESS);
    }

    /// @notice
    /// @dev This function is to add a voting contract, the added contract will be notified when a token transfer occurs
    /// @param contractAddress address of the voting contract
    function addVotingContract(
        address contractAddress
    ) public _ownerOnly isContract(contractAddress) {
        VOTING_CONTRACTS_ADDRESS.push(contractAddress);

        emit VotingContractAdded(contractAddress);
    }

    /// @notice
    /// @dev This function removes address from voting contract array
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
