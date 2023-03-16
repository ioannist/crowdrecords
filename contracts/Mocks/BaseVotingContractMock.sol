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

    constructor(uint8 votingInterval, address owner) BaseVotingContract(owner) {
        VOTING_BLOCK_PERIOD = votingInterval;
    }

    /// @dev This is to set the address of the contracts
    /// @param newTreasuryContractAddress This is the address of new treasury contract
    function initialize(address newTreasuryContractAddress)
        public
        override
        initializer
        _ownerOnly
    {
        BaseVotingContract.initialize(newTreasuryContractAddress);
    }

    event Debug(uint256 amount);

    function createBallot(bool canOwnerVote, uint256 tokenId) public payable {
        uint256 ballotId = _createVoting(canOwnerVote, tokenId);
        _createDeposit(msg.sender, 1 ether, ballotId);
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
        emit BallotResult(ballotId, result, minTurnOut);
    }
}
