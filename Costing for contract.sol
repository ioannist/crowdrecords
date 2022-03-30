// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VotingContract2 {
    uint256 VOTING_INTERVAL = 25;
    address CONTRIBUTION_CONTRACT_ADDRESS;
    address OWNER;

    event createContributionBallot(Ballot);

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

    modifier ownerOnly() {
        require(msg.sender == OWNER, "You are not authorized for this action");
        _;
    }

    function setContributionContractAddress(
        address newContributionContractAddress
    ) public ownerOnly {
        CONTRIBUTION_CONTRACT_ADDRESS = newContributionContractAddress;
    }

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

        //not creating a stuct object and not emits and no return is costing 28855 => $1.69
        //creating a stuct object and not emits, but return is costing 31521 => $1.85
        //Only be callable from the specific contract that is from the recordContract itself.
        // Ballot memory ballot = Ballot({
        //     yes: new address[](0),
        //     no: new address[](0),
        //     owner: contributionCreator,
        //     governanceReward: govReward,
        //     communityReward: commReward,
        //     votingEndBlock: block.number + VOTING_INTERVAL,
        //     isPresent: true
        // });

        //emmiting in this way cost 36203 => $2.13
        // emit createContributionBallot(ballot);

        // Without below and above emiition this cost is : 31497 that is $1.85
        // With below this cost is : 147925 that is $8.6
        // contributionVoting[contributionId] = ballot;
        // emit createContributionBallot(
        //     contributionId,
        //     ballot.owner,
        //     ballot.governanceReward,
        //     ballot.communityReward,
        //     ballot.votingEndBlock
        // );
        // return ballot;
    }

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

    //The Voting amount can only be changed if the amount is proposed in a negotiation and is not owned by the voting reciver
    modifier checkIfNotOwnerOfBallot(uint256 contributionId) {
        require(
            contributionVoting[contributionId].owner != msg.sender,
            "You cannot vote"
        );
        _;
    }

    modifier onlyOwnerOfBallot(uint256 contributionId) {
        require(
            contributionVoting[contributionId].owner == msg.sender,
            "You cannot decide which proposal to accept"
        );
        _;
    }

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
                    contributionVoting[contributionId]
                        .communityReward = contributionCounterOfferMap[
                        contributionId
                    ][counterOfferIds[i]].newCommunityReward;
                    contributionVoting[contributionId]
                        .governanceReward = contributionCounterOfferMap[
                        contributionId
                    ][counterOfferIds[i]].newGovernanceReward;
                    contributionVoting[contributionId].yes.push(
                        counterOfferIds[i]
                    ); //The counter offer ids are the addresses of the user who proposed the offer
                    contributionCounterOfferMap[contributionId][
                        counterOfferIds[i]
                    ].status = 2;
                } else {
                    contributionVoting[contributionId].no.push(
                        counterOfferIds[i]
                    ); //The counter offer ids are the addresses of the user who proposed the offer
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
