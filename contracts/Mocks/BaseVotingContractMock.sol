// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../voting/BaseVotingContract.sol";

contract BaseVotingContractMock is BaseVotingContract {
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

    function createBallot(bool canOwnerVote, uint256 tokenId) public {
        _createVoting(canOwnerVote, tokenId);
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
        bool result = _declareWinner(ballotId);
        emit BallotResult(ballotId, result);
    }
}
