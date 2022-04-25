// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BaseVotingCounterOfferContract.sol";

contract VotingContract is BaseVotingCounterOfferContract {
    //This is the struct that contains the reward data of the contribution
    struct ContributionReward {
        address requester;
        uint256 contributionId;
        uint256 ballotId;
        uint256 communityReward;
        uint256 communityTokenId;
        uint256 governanceReward;
        uint256 governanceTokenId;
        bool isPresent;
    }

    //CounterOffer also known as negotitaion
    struct CounterOffer {
        uint256 newCommunityReward;
        uint256 newGovernanceReward;
        uint256 status; //either ACCEPTED = 2 | PENDING = 1 | REJECTED = 3
    }

    event ContributionBallotCreated(
        address requester,
        uint256 contributionId,
        uint256 communityReward,
        uint256 communityTokenId,
        uint256 governanceReward,
        uint256 governanceTokenId,
        uint256 ballotId
    );

    /**
        @dev This is when a vote is given by user.
        @param voter Address of the voter
        @param contributionId This is the id of the contribution that is linked to this ballot 
        @param ballotId Id of the ballot where voting is stored
        @param vote State of vote : true for yes and false for No
     */
    event ContributionVoting(
        address voter,
        uint256 contributionId,
        uint256 ballotId,
        bool vote
    );

    /**
        @dev this is event which is created when a user proposes counter offer
        @param contributionId This is the id of the contribution that is linked to this ballot 
        @param voterId This is the id of the voter who's vote it is
        @param newGovernanceReward This is the new reward amount counter offered by the voter
        @param newCommunityReward This is the new reward amount counter offered by the voter
     */
    event CounterOfferForContribution(
        uint256 contributionId,
        address voterId,
        uint256 newGovernanceReward,
        uint256 newCommunityReward
    );

    /**
        @dev this is event which is created when the owner of the ballot takes action on a specific counter offer
        @param contributionId This is the id of the contribution that is linked to this ballot 
        @param voterId This is the id of the voter who's vote it is
        @param newGovernanceReward This is the new reward amount counter offered by the voter
        @param newCommunityReward This is the new reward amount counter offered by the voter
        @param status This is the status of the counter offer that is => either ACCEPTED = 2 | REJECTED = 3
     */
    event counterOfferAction(
        uint256 contributionId,
        address voterId,
        uint256 newGovernanceReward,
        uint256 newCommunityReward,
        uint256 status
    ); // status will be => either ACCEPTED = 2 | REJECTED = 3

    mapping(uint256 => ContributionReward) RewardMapping;
    mapping(uint256 => mapping(address => CounterOffer)) contributionCounterOfferMap;
    mapping(uint256 => address[]) contributionCounterOfferList; //This contains all the keys of the mapping of the counterOfferMapping.

    constructor(uint8 votingInterval) BaseVotingContract() {
        VOTING_BLOCK_PERIOD = votingInterval;
    }

    /**
     * @dev This function sets the treasury Contract address
     */
    function setTreasuryContractAddress(address newTreasuryContractAddress)
        public
    {
        _setTreasuryContractAddress(newTreasuryContractAddress);
    }

    /**
     * @dev This function will create a new contribution voting ballot
     */
    function createContributionVotingBallot(
        uint256 contributionId,
        address contributionCreator,
        uint256 govReward,
        uint256 govTokenId,
        uint256 commReward,
        uint256 commTokenId
    ) public {
        require(
            RewardMapping[contributionId].isPresent == false,
            "Voting is already created"
        );

        uint256 ballotId = _createVoting(false);

        ContributionReward memory contributionReward = ContributionReward({
            requester: msg.sender,
            contributionId: contributionId,
            ballotId: ballotId,
            communityReward: commReward,
            communityTokenId: commTokenId,
            governanceReward: govReward,
            governanceTokenId: govTokenId,
            isPresent: true
        });

        emit ContributionBallotCreated({
            requester: msg.sender,
            contributionId: contributionId,
            communityReward: commReward,
            communityTokenId: commTokenId,
            governanceReward: govReward,
            governanceTokenId: govTokenId,
            ballotId: ballotId
        });

        RewardMapping[contributionId] = contributionReward;
    }

    /**
     * @dev This function is called by any user to cast vote
     * @param contributionId this is the id of the contribution for which user is voting
     * @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot
     */
    function castVoteForContribution(uint256 contributionId, bool vote) public {
        super._castVote(RewardMapping[contributionId].ballotId, vote);

        emit ContributionVoting({
            contributionId: contributionId,
            ballotId: RewardMapping[contributionId].ballotId,
            voter: msg.sender,
            vote: vote
        });
    }

    /**
     * @dev This function is called by any user to cast vote
     * @param contributionId this is the id of the contribution for which user is creating a counter offer
     * @param newCommunityReward new comunity token amount as reward for the negotition
     * @param newGovernanceReward new governance token amount as reward for the negotition
     */
    function proposeCounterOffer(
        uint256 contributionId,
        uint256 newCommunityReward,
        uint256 newGovernanceReward
    )
        public
        _checkIfOwnerAllowed(RewardMapping[contributionId].ballotId)
        _checkIfBallotIsOpen(RewardMapping[contributionId].ballotId)
    {
        _createCounterOffer(RewardMapping[contributionId].ballotId);

        //Create counter offer object and push it into array
        CounterOffer memory offer = CounterOffer({
            newCommunityReward: newCommunityReward,
            newGovernanceReward: newGovernanceReward,
            status: 1
        });

        contributionCounterOfferList[contributionId].push(msg.sender);
        contributionCounterOfferMap[contributionId][msg.sender] = offer;

        emit CounterOfferForContribution(
            contributionId,
            msg.sender,
            offer.newGovernanceReward,
            offer.newCommunityReward
        );
    }

    /**
     * @dev This function is called by owner of the contribution to either accept or reject a counter offer
     * @param contributionId this is the id of the contribution to which the counter offer belogs to
     * @param counterOfferIds The id of counter offers in array to accept or reject multiple counter offers at once
     * @param action this is the state of the vote, if true than it means that user accepts the counter offfer
     */
    function actionOnCounterOffer(
        uint256 contributionId,
        address[] memory counterOfferIds,
        bool action
    ) public {
        //only vote once check
        for (uint256 i = 0; i < counterOfferIds.length; i++) {
            if (
                contributionCounterOfferMap[contributionId][counterOfferIds[i]]
                    .status == 1
            ) {
                if (action) {
                    uint256 newGovernanceReward = contributionCounterOfferMap[
                        contributionId
                    ][counterOfferIds[i]].newGovernanceReward;
                    uint256 newCommunityReward = contributionCounterOfferMap[
                        contributionId
                    ][counterOfferIds[i]].newCommunityReward;

                    //Set new reward for the contribution
                    RewardMapping[contributionId]
                        .communityReward = newCommunityReward;
                    RewardMapping[contributionId]
                        .governanceReward = newGovernanceReward;

                    contributionCounterOfferMap[contributionId][
                        counterOfferIds[i]
                    ].status = 2;

                    super._counterOfferAction(
                        RewardMapping[contributionId].ballotId,
                        counterOfferIds[i],
                        true
                    );
                    emit counterOfferAction(
                        contributionId,
                        counterOfferIds[i],
                        newGovernanceReward,
                        newCommunityReward,
                        2
                    );
                } else {
                    super._counterOfferAction(
                        RewardMapping[contributionId].ballotId,
                        counterOfferIds[i],
                        false
                    );
                    //The counter offer ids are the addresses of the user who proposed the offer
                    contributionCounterOfferMap[contributionId][
                        counterOfferIds[i]
                    ].status = 3;
                }
            }
        }
    }
}
