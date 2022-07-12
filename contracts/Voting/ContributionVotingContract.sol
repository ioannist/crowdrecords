// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BaseVotingCounterOfferContract.sol";
import "../TreasuryContract.sol";

contract ContributionVotingContract is BaseVotingCounterOfferContract {
    //This is the struct that contains the reward data of the contribution
    struct ContributionReward {
        address requester;
        uint256 contributionId;
        uint256 recordId;
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
        uint256 recordId,
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

    /**
        @dev this event is genrated when result of a ballot is declared
        @param contributionId This is the id of the contribution that is linked to this ballot 
        @param ballotId this is the ballot Id for which result is declared 
        @param result this is the status of the result //either true if user won that is he recived more than 66% of votes or false if user lost 
     */
    event BallotResult(uint256 contributionId, uint256 ballotId, bool result);

    mapping(uint256 => ContributionReward) rewardMapping;
    //Bellow mapping is ContributionId => User's address => Counter Offer data
    mapping(uint256 => mapping(address => CounterOffer)) contributionCounterOfferMap;
    //This contains all the keys (The key's are users address) of the mapping of the counterOfferMapping.
    mapping(uint256 => address[]) contributionCounterOfferList;
    address public CONTRIBUTION_CONTRACT_ADDRESS;

    constructor(uint8 votingInterval) BaseVotingContract() {
        VOTING_BLOCK_PERIOD = votingInterval;
    }

    modifier _onlyContributionContract() {
        require(
            msg.sender == CONTRIBUTION_CONTRACT_ADDRESS,
            "You are not contribution contract"
        );
        _;
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

    /**
     * @dev This function sets the treasury Contract address
     */
    // function setOrderContractAddress(address newOrderContractAddress)
    //     external
    //     _ownerOnly
    // {
    //     _setOrderContractAddress(newOrderContractAddress);
    // }

    /**
     * @dev Sets the contribution contract address so that the voting ballot for contritbution can be restricted only to a certain contract that is the contribution contract
     */
    function setContributionContractAddress(
        address newContributionContractAddress
    ) public _ownerOnly {
        CONTRIBUTION_CONTRACT_ADDRESS = newContributionContractAddress;
    }

    /**
     * @dev This function will create a new contribution voting ballot
     */
    function createContributionVotingBallot(
        uint256 contributionId,
        uint256 recordId,
        uint256 govReward,
        uint256 govTokenId,
        uint256 commReward,
        uint256 commTokenId
    ) public _onlyContributionContract {
        require(
            rewardMapping[contributionId].isPresent == false,
            "Voting is already created"
        );

        uint256 ballotId = _createVoting(true);

        ContributionReward memory contributionReward = ContributionReward({
            requester: tx.origin,
            contributionId: contributionId,
            recordId: recordId,
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
            recordId: recordId,
            communityReward: commReward,
            communityTokenId: commTokenId,
            governanceReward: govReward,
            governanceTokenId: govTokenId,
            ballotId: ballotId
        });

        rewardMapping[contributionId] = contributionReward;
    }

    /**
     * @dev This function is called by any user to cast vote
     * @param contributionId this is the id of the contribution for which user is voting
     * @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot
     */
    function castVoteForContribution(uint256 contributionId, bool vote) public {
        super._castVote(rewardMapping[contributionId].ballotId, vote);

        emit ContributionVoting({
            contributionId: contributionId,
            ballotId: rewardMapping[contributionId].ballotId,
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
        _checkIfOwnerAllowed(rewardMapping[contributionId].ballotId)
        _checkIfBallotIsOpen(rewardMapping[contributionId].ballotId, msg.sender)
    {
        _createCounterOffer(rewardMapping[contributionId].ballotId);

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
                    rewardMapping[contributionId]
                        .communityReward = newCommunityReward;
                    rewardMapping[contributionId]
                        .governanceReward = newGovernanceReward;

                    contributionCounterOfferMap[contributionId][
                        counterOfferIds[i]
                    ].status = 2;

                    super._counterOfferAction(
                        rewardMapping[contributionId].ballotId,
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
                        rewardMapping[contributionId].ballotId,
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

    /**
     * @dev This function can be called from external source and also from within the contract
     * @param contributionId this is the id of the contribution to which the winner is to be decleared
     */
    function declareWinner(uint256 contributionId) external {
        address[] memory counterOfferList = contributionCounterOfferList[
            contributionId
        ];
        for (uint256 i = 0; i < counterOfferList.length; i++) {
            if (
                contributionCounterOfferMap[contributionId][counterOfferList[i]]
                    .status == 1
            ) {
                super._counterOfferAction(
                    rewardMapping[contributionId].ballotId,
                    counterOfferList[i],
                    false
                );
                //The counter offer ids are the addresses of the user who proposed the offer
                contributionCounterOfferMap[contributionId][counterOfferList[i]]
                    .status = 3;
            }
        }
        bool result = _declareWinner(
            rewardMapping[contributionId].ballotId,
            rewardMapping[contributionId].governanceTokenId
        );

        emit BallotResult(
            contributionId,
            rewardMapping[contributionId].ballotId,
            result
        );

        if (result) {
            //Transfer the reward amount to user
            TreasuryContract treasuryContract = TreasuryContract(
                TREASURY_CONTRACT_ADDRESS
            );
            treasuryContract.transferRewardAmount(
                rewardMapping[contributionId].requester,
                rewardMapping[contributionId].recordId,
                contributionId,
                rewardMapping[contributionId].governanceReward,
                rewardMapping[contributionId].communityReward
            );
        }
    }
}
