// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BaseVotingCounterOfferContract.sol";
import "../interface/ITreasury.sol";

contract ContributionVotingContract is BaseVotingCounterOfferContract {
    /// @dev This structure will hold the data for contribution rewards
    /// @param requester This is the person who has contributed and is seeking for reward
    /// @param contributionId This is the contribution id
    /// @param recordId This is the record id to which the reward belongs to
    /// @param ballotId This is the ballot id of the reward
    /// @param communityReward This is the community reward amount
    /// @param communityTokenId This is the id of community token
    /// @param governanceReward This is the amount of governance token requested as reward
    /// @param governanceTokenId This is the id of governance token
    /// @param isPresent This is to check if a contribution is present for a specific contribution
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

    /// @dev This structure will hold the data for contribution rewards
    /// @param newCommunityReward This is the community reward amount
    /// @param newGovernanceReward This is the amount of governance token requested as reward
    /// @param status This is status of the offer that is either : PENDING = 1 | ACCEPTED = 2 | REJECTED = 3
    struct CounterOffer {
        uint256 newCommunityReward;
        uint256 newGovernanceReward;
        uint256 status;
    }

    /// @notice This event is emitted when a contribution ballot is created by a user and it hold the following details
    /// @dev This event is emitted during contribution ballot creation
    /// @param requester This is the person who has contributed and is seeking for reward
    /// @param contributionId This is the contribution id
    /// @param recordId This is the record id to which the reward belongs to
    /// @param communityReward This is the community reward amount
    /// @param communityTokenId This is the id of community token
    /// @param governanceReward This is the amount of governance token requested as reward
    /// @param governanceTokenId This is the id of governance token
    /// @param ballotId This is the ballot id of the reward
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

    /// @dev This is when a vote is given by user.
    /// @param voter Address of the voter
    /// @param contributionId This is the id of the contribution that is linked to this ballot
    /// @param ballotId Id of the ballot where voting is stored
    /// @param vote State of vote : true for yes and false for No
    event ContributionVoting(
        address voter,
        uint256 contributionId,
        uint256 ballotId,
        bool vote
    );

    /// @dev this is event which is created when a user proposes counter offer
    /// @param contributionId This is the id of the contribution that is linked to this ballot
    /// @param voterId This is the id of the voter who's vote it is
    /// @param newGovernanceReward This is the new reward amount counter offered by the voter
    /// @param newCommunityReward This is the new reward amount counter offered by the voter
    event CounterOfferForContribution(
        uint256 contributionId,
        address voterId,
        uint256 newGovernanceReward,
        uint256 newCommunityReward
    );

    /// @dev this is event which is created when the owner of the ballot takes action on a specific counter offer
    /// @param contributionId This is the id of the contribution that is linked to this ballot
    /// @param voterId This is the id of the voter who's vote it is
    /// @param newGovernanceReward This is the new reward amount counter offered by the voter
    /// @param newCommunityReward This is the new reward amount counter offered by the voter
    /// @param status This is the status of the counter offer that is => either ACCEPTED = 2 | REJECTED = 3
    event counterOfferAction(
        uint256 contributionId,
        address voterId,
        uint256 newGovernanceReward,
        uint256 newCommunityReward,
        uint256 status
    );

    /// @dev this event is genrated when result of a ballot is declared
    /// @param contributionId This is the id of the contribution that is linked to this ballot
    /// @param ballotId this is the ballot Id for which result is declared
    /// @param result this is the status of the result, either true if user won that is
    /// he received more than 66% of votes or false if user lost
    event BallotResult(uint256 contributionId, uint256 ballotId, bool result);

    mapping(uint256 => ContributionReward) rewardMapping;
    //Bellow mapping is ContributionId => User's address => Counter Offer data
    mapping(uint256 => mapping(address => CounterOffer)) contributionCounterOfferMap;
    //This contains all the keys (The key's are users address) of the mapping of the counterOfferMapping.
    mapping(uint256 => address[]) contributionCounterOfferList;
    address public CONTRIBUTION_CONTRACT_ADDRESS;

    constructor(uint8 votingInterval, address owner)
        BaseVotingCounterOfferContract(owner)
    {
        VOTING_BLOCK_PERIOD = votingInterval;
    }

    modifier _onlyContributionContract() {
        require(
            msg.sender == CONTRIBUTION_CONTRACT_ADDRESS,
            "UNAUTHORIZED: ONLY_CONTRIBUTION_CONTRACT"
        );
        _;
    }

    /// @dev This is to set the address of the contracts
    /// @param newTreasuryContractAddress This is the address of new treasury contract
    /// @param newContributionContractAddress This is the address of new voting hub contract
    function initialize(
        address newTreasuryContractAddress,
        address newContributionContractAddress
    ) public initializer _ownerOnly {
        BaseVotingCounterOfferContract.initialize(newTreasuryContractAddress);
        CONTRIBUTION_CONTRACT_ADDRESS = newContributionContractAddress;
    }

    /// @dev Sets the contribution contract address so that the voting ballot for contribution can
    /// be restricted only to a certain contract that is the contribution contract
    function setContributionContractAddress(
        address newContributionContractAddress
    ) public _ownerOnly {
        CONTRIBUTION_CONTRACT_ADDRESS = newContributionContractAddress;
    }

    /// @dev This function will create a new contribution voting ballot
    function createContributionVotingBallot(
        uint256 contributionId,
        uint256 recordId,
        uint256 govReward,
        uint256 commReward
    ) public _onlyContributionContract {
        require(
            rewardMapping[contributionId].isPresent == false,
            "INVALID: BALLOT_ALREADY_CREATED"
        );

        ITreasury treasuryContract = ITreasury(TREASURY_CONTRACT_ADDRESS);

        uint256 govTokenId = treasuryContract.getCommunityTokenId(recordId);
        uint256 commTokenId = treasuryContract.getGovernanceTokenId(recordId);

        uint256 ballotId = _createVoting(true, govTokenId);

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

    /// @dev This function is called by any user to cast vote
    /// @param contributionId this is the id of the contribution for which user is voting
    /// @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot
    function castVoteForContribution(uint256 contributionId, bool vote) public {
        require(
            rewardMapping[contributionId].isPresent == true,
            "INVALID: CONTRIBUTION_ID"
        );
        super._castVote(rewardMapping[contributionId].ballotId, vote);

        emit ContributionVoting({
            contributionId: contributionId,
            ballotId: rewardMapping[contributionId].ballotId,
            voter: msg.sender,
            vote: vote
        });
    }

    /// @dev This function is called by any user to cast vote
    /// @param contributionId this is the id of the contribution for which user is creating a counter offer
    /// @param newCommunityReward new community token amount as reward for the negotiation
    /// @param newGovernanceReward new governance token amount as reward for the negotiation
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

    /// @dev This function is called by owner of the contribution to either accept or reject a counter offer
    /// @param contributionId this is the id of the contribution to which the counter offer belongs to
    /// @param counterOfferIds The id of counter offers in array to accept or reject multiple counter offers at once
    /// @param action this is the state of the vote, if true than it means that user accepts the counter offer
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

    /// @dev This function can be called from external source and also from within the contract
    /// @param contributionId this is the id of the contribution to which the winner is to be declared
    function declareWinner(uint256 contributionId) external {
        address[] memory counterOfferList = contributionCounterOfferList[
            contributionId
        ];

        //! we should remove the below for loop as we don't need loop through all the offers
        //! as we are only calculating the votes that are accepted and rest are considered as false
        // for (uint256 i = 0; i < counterOfferList.length; i++) {
        //     if (
        //         contributionCounterOfferMap[contributionId][counterOfferList[i]]
        //             .status == 1
        //     ) {
        //         super._counterOfferAction(
        //             rewardMapping[contributionId].ballotId,
        //             counterOfferList[i],
        //             false
        //         );
        //         //The counter offer ids are the addresses of the user who proposed the offer
        //         contributionCounterOfferMap[contributionId][counterOfferList[i]]
        //             .status = 3;
        //     }
        // }
        bool result = _declareWinner(rewardMapping[contributionId].ballotId);

        emit BallotResult(
            contributionId,
            rewardMapping[contributionId].ballotId,
            result
        );

        if (result) {
            //Transfer the reward amount to user
            ITreasury treasuryContract = ITreasury(TREASURY_CONTRACT_ADDRESS);
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
