// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../voting/BaseVotingCounterOfferContract.sol";

contract BaseVotingCounterOfferContractMock is BaseVotingCounterOfferContract {
    uint256 private LastTokenId = 1;

    /// @dev this event is generated when result of a ballot is declared
    /// @param ballotId this is the ballot Id for which result is declared
    /// @param result this is the status of the result //either true if user won that is he received more than 66% of votes or false if user lost
    /// @param minTurnOut this status indicates if minimum amount of user showed up for voting
    event BallotResult(uint256 ballotId, bool result, bool minTurnOut);

    /// @dev this event is generated when a counter offer is created
    /// @param ballotId this is the ballot Id for which result is declared
    /// @param creator this is the address of the creator of counter offer
    event CounterOfferCreated(uint256 ballotId, address creator);

    /// @dev this event is generated when a counter offer is either accepted or rejected
    /// @param ballotId this is the ballot Id for which result is declared
    /// @param creator this is the address of the creator of counter offer
    /// @param result this is the result of the counter offer that is true for accepted and false for rejected
    event CounterOfferResult(uint256 ballotId, address creator, bool result);

    constructor(uint8 votingInterval, address owner)
        BaseVotingCounterOfferContract(owner)
    {
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
        BaseVotingCounterOfferContract.initialize(newTreasuryContractAddress);
    }

    function createBallot(bool canOwnerVote, uint256 tokenId) public payable {
        uint256 ballotId = _createVoting(canOwnerVote, tokenId);
        _createDeposit(msg.sender, 1 ether, ballotId);
    }

    function castVote(uint256 ballotId, bool vote) public {
        _castVote(ballotId, vote);
    }

    function createCounterOffer(uint256 ballotId) public {
        _createCounterOffer(ballotId);
        emit CounterOfferCreated(ballotId, msg.sender);
    }

    function counterOfferAction(
        uint256 votingBallotId,
        address user,
        bool vote
    ) public {
        _counterOfferAction(votingBallotId, user, vote);
        emit CounterOfferResult(votingBallotId, user, vote);
    }

    function declareWinner(uint256 ballotId) public {
        (bool result, bool minTurnOut) = _declareWinner(ballotId);
        emit BallotResult(ballotId, result, minTurnOut);
        _releaseDeposit(ballotId);
    }
}
