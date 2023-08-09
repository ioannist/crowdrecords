// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../voting/BaseVotingContract.sol";

contract BaseVotingContractMock is BaseVotingContract {
    uint256 private LastTokenId = 1;

    /// @dev this event is generated when result of a ballot is declared
    /// @param ballotId this is the ballot Id for which result is declared
    /// @param result this is the status of the result either true if user won that is he received
    /// @param minTurnOut this status indicates if minimum amount of user showed up for voting
    /// more than 66% of votes or false if user lost
    event BallotResult(uint256 ballotId, bool result, bool minTurnOut);

    /// @dev this event is generated when result of a ballot is declared
    /// @param ballotId this is the ballot Id which is generated
    event BallotCreated(uint256 ballotId);

    /// @dev this will be emitted when a deposit is made
    /// @param owner This is the owner of the voting deposit
    /// @param ballotId This is the id of the voting ballot
    /// @param depositAmount This is the amount of token that are deposited by the user
    /// @param isClaimed This represents if a deposit has been claimed or not
    /// @param isPresent This represents if a deposit has been actually created or not
    event DepositCreated(
        address owner,
        uint256 ballotId,
        uint256 depositAmount,
        bool isClaimed,
        bool isPresent
    );

    /// @dev this will be emitted when the user makes claim
    /// @param owner This is the owner of the voting deposit
    /// @param ballotId This is the id of the voting ballot
    /// @param depositAmount This is the amount of token that are deposited by the user
    event DepositClaimed(
        address owner,
        uint256 ballotId,
        uint256 depositAmount
    );

    constructor(uint8 votingInterval, address owner) BaseVotingContract(owner) {
        VOTING_BLOCK_PERIOD = votingInterval;
    }

    /// @dev This is to set the address of the contracts
    /// @param newTreasuryContractAddress This is the address of new treasury contract
    /// @param newGovernanceContractAddress This is the address for the governance contract
    function initialize(
        address newTreasuryContractAddress,
        address newGovernanceContractAddress
    ) public override initializer _ownerOnly {
        BaseVotingContract.initialize(
            newTreasuryContractAddress,
            newGovernanceContractAddress
        );
    }

    function createBallot(bool canOwnerVote, uint256 tokenId) public payable {
        uint256 ballotId = _createVoting(canOwnerVote, tokenId);
        _createDeposit(msg.sender, msg.value, ballotId);
        VotingDeposit memory votingDeposit = depositMap[ballotId];
        emit DepositCreated(
            votingDeposit.owner,
            votingDeposit.ballotId,
            votingDeposit.depositAmount,
            votingDeposit.isClaimed,
            votingDeposit.isPresent
        );
        emit BallotCreated(ballotId);
    }

    function castVote(uint256 ballotId, bool vote) public {
        _castVote(ballotId, vote);
    }

    function castVoteForOther(
        uint256 ballotId,
        bool vote,
        address voter
    ) public {
        _castVoteForOther(ballotId, vote, voter);
    }

    function declareWinner(uint256 ballotId) public {
        (bool result, bool minTurnOut) = _declareWinner(ballotId);
        _releaseDeposit(ballotId);
        emit DepositClaimed(
            depositMap[ballotId].owner,
            ballotId,
            depositMap[ballotId].depositAmount
        );
        emit BallotResult(ballotId, result, minTurnOut);
    }
}
