// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../voting/BaseVotingCounterOfferContract.sol";

contract BaseVotingCounterOfferContractMock is BaseVotingCounterOfferContract {
    uint256 private LastTokenId = 1;

    /**
        @dev this event is genrated when result of a ballot is declared
        @param ballotId this is the ballot Id for which result is declared 
        @param result this is the status of the result //either true if user won that is he recived more than 66% of votes or false if user lost 
     */
    event BallotResult(uint256 ballotId, bool result);

    constructor(uint8 votingInterval) {
        VOTING_BLOCK_PERIOD = votingInterval;
    }

    /**
     * @dev This function sets the treasury Contract address
     */
    function setTreasuryContractAddress(address newTreasuryContractAddress)
        external
        _ownerOnly
    {
        _setTreasuryContractAddress(newTreasuryContractAddress);
    }

    function createBallot(bool canOwnerVote) public {
        _createVoting(canOwnerVote);
    }

    function castVote(uint256 ballotId, bool vote) public {
        _castVote(ballotId, vote);
    }

    function createCounterOffer(uint256 ballotId) public {
        _createCounterOffer(ballotId);
    }

    function counterOfferAction(
        uint256 votingBallotId,
        address user,
        bool vote
    ) public {
        _counterOfferAction(votingBallotId, user, vote);
    }

    function declareWinner(uint256 ballotId, uint256 tokenId) public {
        bool result = _declareWinner(ballotId, tokenId);
        emit BallotResult(ballotId, result);
    }
}