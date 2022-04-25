// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../TreasuryContract.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./BaseVotingContract.sol";

contract BaseVotingCounterOfferContract is BaseVotingContract {
    mapping(uint256 => mapping(address => bool)) counterOffered;

    /**
     * @dev This function check if the user has created the counter offer or not, if it is created it will revert the transaction
     */
    modifier _shouldNotHaveCreatedCounterOffer(uint256 votingBallotId) {
        require(
            counterOffered[votingBallotId][msg.sender] == false,
            "You have already given a counter offer"
        );
        _;
    }

    /**
     * @dev reverts transaction if the user has not created a counter offer
     */
    modifier _shouldHaveCreatedCounterOffer(uint256 votingBallotId) {
        require(
            counterOffered[votingBallotId][msg.sender] == true,
            "You have already given a counter offer"
        );
        _;
    }

    /**
     * @dev This modifier checks if a ballot is open for voting or has the time expired
     */
    modifier _checkIfCounterOffered(uint256 votingBallotId) {
        require(
            counterOffered[votingBallotId][msg.sender] == false,
            "You have already given a counter offer"
        );
        _;
    }

    /**
     * @dev This function is called by any user to cast vote
     * @param votingBallotId this is the id of the ballot for which user is voting
     * @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot
     */
    function _castVote(uint256 votingBallotId, bool vote)
        internal
        override
        _shouldNotHaveCreatedCounterOffer(votingBallotId)
    {
        super._castVote(votingBallotId, vote);
    }

    /**
     * @dev This function is called when you create a counter offer
     * @param votingBallotId this is the id of the ballot for which user is voting
     */
    function _createCounterOffer(uint256 votingBallotId)
        internal
        _shouldNotHaveCreatedCounterOffer(votingBallotId)
    {
        alreadyVoted[votingBallotId][msg.sender] = true;
    }

    /**
     * @notice THIS IS ONLY FOR THE USERS WHO HAS APPLIED A CONTER OFFER
     * @dev This function is called by any user to cast vote
     * @param votingBallotId this is the id of the ballot for which user is voting
     */
    function _counterOfferAction(
        uint256 votingBallotId,
        address user,
        bool vote
    ) internal _shouldHaveCreatedCounterOffer(votingBallotId) {
        super._castVoteForOther(votingBallotId, vote, user);
    }
}
