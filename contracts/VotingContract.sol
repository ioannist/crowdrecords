// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VotingContract {
    uint256 VOTING_INTERVAL = 25;
    address public CONTRIBUTION_CONTRACT_ADDRESS;
    address OWNER;

    event createContributionBallot(
        uint256 contributionId,
        address owner,
        uint256 governanceReward,
        uint256 communityReward,
        uint256 votingEndBlock
    );

    event voteForContribution(
        uint256 contributionId,
        address voterId,
        bool vote
    );

    event counterOfferForContribution(
        uint256 contributionId,
        address voterId,
        uint256 newGovernanceReward,
        uint256 newCommunityReward
    );

    event counterOfferAction(
        uint256 contributionId,
        address voterId,
        uint256 newGovernanceReward,
        uint256 newCommunityReward,
        uint256 status
    ); // status will be => either ACCEPTED = 2 | REJECTED = 3

    // Voting structure containing yes and no addresses with reward amount
    struct Ballot {
        address owner;
        address[] yes;
        address[] no;
        uint256 communityReward;
        uint256 governanceReward;
        uint256 votingEndBlock;
        bool isPresent;
    }

    //CounterOffer also known as negotitaion
    struct CounterOffer {
        uint256 newCommunityReward;
        uint256 newGovernanceReward;
        uint256 status; //either ACCEPTED = 2 | PENDING = 1 | REJECTED = 3
    }

    mapping(uint256 => mapping(address => bool)) alreadyVotedContribution; // this one to check if the voting is already done or not.
    mapping(uint256 => address[]) contributionCounterOfferList; //This contains all the keys of the mapping of the counterOfferMapping.
    mapping(uint256 => mapping(address => CounterOffer)) contributionCounterOfferMap; //This contains all the counter offers for a voting.
    mapping(uint256 => Ballot) contributionVoting;

    mapping(uint256 => mapping(address => bool)) alreadyVotedPublisher; // this one to check if the voting is already done or not.
    mapping(uint256 => Ballot) publisherVoting;

    constructor() {
        OWNER = msg.sender;
    }

    /**
     * @dev Modifier to check that the person who accesses a specific function is the owner himself.
     */
    modifier ownerOnly() {
        require(msg.sender == OWNER, "You are not authorized for this action");
        _;
    }

    /**
     * @dev Sets the contribution contract address so that the voting ballot for contritbution can be restricted only to a certain contract that is the contribution contract
     */
    function setContributionContractAddress(
        address newContributionContractAddress
    ) public ownerOnly {
        CONTRIBUTION_CONTRACT_ADDRESS = newContributionContractAddress;
    }

    /**
     * @dev This function will create a new contribution voting ballot
     */
    function createContributionVotingBallot(
        uint256 contributionId,
        address contributionCreator,
        uint256 govReward,
        uint256 commReward
    ) public returns (Ballot memory ballot) {
        require(
            contributionVoting[contributionId].isPresent == false,
            "Voting is already created"
        );

        require(
            CONTRIBUTION_CONTRACT_ADDRESS == msg.sender,
            "You are not authorized for this request"
        );

        Ballot memory ballot = Ballot({
            yes: new address[](0),
            no: new address[](0),
            owner: contributionCreator,
            governanceReward: govReward,
            communityReward: commReward,
            votingEndBlock: block.number + VOTING_INTERVAL,
            isPresent: true
        });

        contributionVoting[contributionId] = ballot;
        emit createContributionBallot(
            contributionId,
            ballot.owner,
            ballot.governanceReward,
            ballot.communityReward,
            ballot.votingEndBlock
        );
        return ballot;
    }

    /**
     * @dev This modifier checks if a ballot is open for voting or has the time expired
     */
    modifier checkIfBallotIsOpen(uint256 contributionId) {
        require(
            contributionVoting[contributionId].isPresent == true,
            "No ballot with your id is found"
        );

        require(
            contributionVoting[contributionId].votingEndBlock > block.number,
            "Voting time is over"
        );

        require(
            alreadyVotedContribution[contributionId][msg.sender] == false,
            "You have already voted"
        );
        _;
    }

    /**
     * @dev This modifier will check that the caller can be anybody apart from the owner of the ballot.
     */
    modifier checkIfNotOwnerOfBallot(uint256 contributionId) {
        require(
            contributionVoting[contributionId].owner != msg.sender,
            "You cannot vote"
        );
        _;
    }

    /**
     * @dev This modifier will check that the caller can only be owner of the ballot.
     */
    modifier onlyOwnerOfBallot(uint256 contributionId) {
        require(
            contributionVoting[contributionId].owner == msg.sender,
            "You cannot decide which proposal to accept"
        );
        _;
    }

    /**
     * @dev This function is called by any user to cast vote
     * @param contributionId this is the id of the contribution for which user is voting
     * @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot
     */
    function castVoteForContribution(uint256 contributionId, bool vote)
        public
        checkIfBallotIsOpen(contributionId)
        checkIfNotOwnerOfBallot(contributionId)
    {
        if (vote) {
            contributionVoting[contributionId].yes.push(msg.sender);
        } else {
            contributionVoting[contributionId].no.push(msg.sender);
        }

        alreadyVotedContribution[contributionId][msg.sender] = true;

        emit voteForContribution(contributionId, msg.sender, vote);
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
        checkIfBallotIsOpen(contributionId)
        checkIfNotOwnerOfBallot(contributionId)
    {
        //Check if counter offer exists or not
        require(
            alreadyVotedContribution[contributionId][msg.sender] == false,
            "You have already voted or given a counter offer"
        );

        //Create counter offer object and push it into array
        CounterOffer memory offer = CounterOffer({
            newCommunityReward: newCommunityReward,
            newGovernanceReward: newGovernanceReward,
            status: 1
        });

        contributionCounterOfferList[contributionId].push(msg.sender);
        contributionCounterOfferMap[contributionId][msg.sender] = offer;
        alreadyVotedContribution[contributionId][msg.sender];

        emit counterOfferForContribution(
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
    )
        public
        checkIfBallotIsOpen(contributionId)
        onlyOwnerOfBallot(contributionId)
    {
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
                    contributionVoting[contributionId]
                        .communityReward = newCommunityReward;
                    contributionVoting[contributionId]
                        .governanceReward = newGovernanceReward;

                    contributionVoting[contributionId].yes.push(
                        counterOfferIds[i]
                    ); //The counter offer ids are the addresses of the user who proposed the offer
                    contributionCounterOfferMap[contributionId][
                        counterOfferIds[i]
                    ].status = 2;
                    emit counterOfferAction(
                        contributionId,
                        msg.sender,
                        newGovernanceReward,
                        newCommunityReward,
                        2
                    );
                } else {
                    contributionVoting[contributionId].no.push(
                        counterOfferIds[i]
                    );
                    //The counter offer ids are the addresses of the user who proposed the offer
                    contributionCounterOfferMap[contributionId][
                        counterOfferIds[i]
                    ].status = 3;
                }
            }
        }
    }

    function contributionBallotResult(uint256 contributionId)
        public
        checkIfBallotIsOpen(contributionId)
    {
        //Ballot result => when calculating balance create a function in recordContract that wil return balance of multiple address
        //get the votes from voting map
        //get the weightage of all the votes
        //if yes is more
        //initiate transfer of funds
        //set contribution as accepted
        //if no is more
        //set contribution as rejected
    }
}
