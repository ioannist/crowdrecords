// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../TreasuryContract.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../OrdersContract.sol";

contract BaseVotingContract {
    /// @dev this is Contribution Create event this event will be emited when a new contribution is created.
    /// @param owner This is the owner of the voting ballot
    /// @param yesWeight This is the weightage of yes in the ballot
    /// @param yesCount This is the count of yes in the ballot
    /// @param noWeight This is the weightage of no in the ballot
    /// @param noCount This is the count of no in the ballot
    /// @param tokenId This is the token id using which the voting is done
    /// @param votingEndBlock This is the block number till which the voting can be done for specific ballot
    /// @param isResultDeclared This specifies if result is declared
    /// @param canOwnerVote This specifies if a owner can vote or not
    /// @param isPresent This is to check if a ballot of specific id is present or not
    struct VotingBallot {
        address owner;
        uint256 yesWeight;
        uint256 yesCount;
        uint256 noWeight;
        uint256 noCount;
        uint256 tokenId;
        uint256 votingEndBlock;
        bool isResultDeclared;
        bool canOwnerVote;
        bool isPresent;
    }

    uint256 VOTING_BLOCK_PERIOD = 25;
    address public TREASURY_CONTRACT_ADDRESS;
    address public TREASURY_HUB_ADDRESS;
    address public OWNER;

    uint256 votingId = 0;
    mapping(uint256 => VotingBallot) votingMap;
    //This mapping tracks the state of user, that is if they have voted already or not.
    // Ballot id => user address => bool
    mapping(uint256 => mapping(address => bool)) alreadyVoted;
    //This mapping is useful if the user has voted, as this hold if user voted yes or no for a specific ballot,
    mapping(uint256 => mapping(address => bool)) userVotes;

    //Active ballot list in which user have voted
    // user address => List of ballot in which user has voted
    mapping(address => uint256[]) userActiveVotedBallots;

    constructor(address owner) {
        OWNER = owner;
    }

    /// @dev This modifier checks if a ballot is open for voting or has the time expired
    /// @param votingBallotId This is the id of the ballot which we are checking
    /// @param voter This is the address of the voter for whom we are checking voting rights
    modifier _checkIfBallotIsOpen(uint256 votingBallotId, address voter) {
        require(
            votingMap[votingBallotId].isPresent == true,
            "No ballot with your id is found"
        );

        require(
            votingMap[votingBallotId].votingEndBlock > block.number,
            "Voting time is over"
        );

        require(
            alreadyVoted[votingBallotId][voter] == false,
            "You have already voted"
        );

        _;
    }

    /// @dev Modifier to check that the person who accesses a specific function is the owner himself.
    modifier _ownerOnly() {
        require(msg.sender == OWNER, "You are not authorized for this action");
        _;
    }

    /// @dev This modifier checks if a ballot is open for voting or has the time expired
    /// @param votingBallotId This is the id of the ballot which we are checking
    modifier _checkIfOwnerAllowed(uint256 votingBallotId) {
        if (votingMap[votingBallotId].canOwnerVote) {
            require(
                alreadyVoted[votingBallotId][tx.origin] == false,
                "You have already voted"
            );
        } else if (tx.origin == votingMap[votingBallotId].owner) {
            revert("Owner cannot vote");
        }
        _;
    }

    /// @dev This function sets the owner address
    /// @param ownerAddress This is the address of the owner
    function setOwnerAddress(address ownerAddress) public _ownerOnly {
        OWNER = ownerAddress;
    }

    /// @dev This function is called by user to creata a new voting
    /// @param canOwnerVote this is if a user can vote in a voting which he created
    /// @param tokenId This is the id of the token using which voting can be done
    function _createVoting(bool canOwnerVote, uint256 tokenId)
        internal
        returns (uint256)
    {
        votingId++;

        VotingBallot memory voting = VotingBallot({
            owner: tx.origin,
            yesWeight: 0,
            yesCount: 0,
            noWeight: 0,
            noCount: 0,
            tokenId: tokenId,
            votingEndBlock: block.number + VOTING_BLOCK_PERIOD,
            isResultDeclared: false,
            canOwnerVote: canOwnerVote,
            isPresent: true
        });

        votingMap[votingId] = voting;
        return votingId;
    }

    /// @dev This function sets the treasury Contract address
    /// @param newTreasuryContractAddress This is the new address of treasury contract
    function _setTreasuryContractAddress(address newTreasuryContractAddress)
        internal
        virtual
        _ownerOnly
    {
        TREASURY_CONTRACT_ADDRESS = newTreasuryContractAddress;
    }

    /// @dev This function sets the treasury Contract address
    /// @param newOwnerAddress This is the address of new owner
    function _setOwnerAddress(address newOwnerAddress)
        internal
        virtual
        _ownerOnly
    {
        TREASURY_CONTRACT_ADDRESS = newOwnerAddress;
    }

    /// @dev This function is called by any user to cast vote
    /// @param votingBallotId this is the id of the ballot for which user is voting
    /// @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot
    function _castVote(uint256 votingBallotId, bool vote)
        internal
        virtual
        _checkIfBallotIsOpen(votingBallotId, msg.sender)
        _checkIfOwnerAllowed(votingBallotId)
    {
        _castVotePrivate(votingBallotId, vote, tx.origin);
    }

    /// @dev This function is called when the vote is casted on later stages such as in counter offer where the vote is
    /// reviewed before hand by the user and then it is accepted by the user.
    /// @param votingBallotId this is the id of the ballot for which user is voting
    /// @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot
    function _castVoteForOther(
        uint256 votingBallotId,
        bool vote,
        address voter
    ) internal _checkIfBallotIsOpen(votingBallotId, voter) {
        _castVotePrivate(votingBallotId, vote, voter);
    }

    /// @dev core logic for voting
    /// @param votingBallotId this is the id of the ballot for which user is voting
    /// @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot
    /// @param voter Voter's address
    function _castVotePrivate(
        uint256 votingBallotId,
        bool vote,
        address voter
    ) private {
        TreasuryContract treasuryContract = TreasuryContract(
            TREASURY_CONTRACT_ADDRESS
        );
        VotingBallot memory votingBallot = votingMap[votingBallotId];
        uint256 bal = treasuryContract.balanceOf(voter, votingBallot.tokenId);

        if (vote) {
            votingMap[votingBallotId].yesWeight += bal;
            votingMap[votingBallotId].yesCount += 1;
        } else {
            votingMap[votingBallotId].noWeight += bal;
            votingMap[votingBallotId].noCount += 1;
        }

        alreadyVoted[votingBallotId][voter] = true;
        userVotes[votingBallotId][voter] = vote;
        uint256[] storage list = userActiveVotedBallots[voter];
        list.push(votingBallotId);
    }

    /// @dev core logic for voting
    /// @param votingBallotId this is the id of the ballot for which user is voting
    /// @param voter Voter's address
    /// @param oldWeight Old weight of the voter
    /// @param newWeight New weight of the voter
    function _changeVoteWeight(
        uint256 votingBallotId,
        address voter,
        uint256 oldWeight,
        uint256 newWeight
    ) private {
        require(
            alreadyVoted[votingBallotId][voter] == true,
            "User has not voted yet"
        );
        bool vote = userVotes[votingBallotId][voter];
        if (vote) {
            votingMap[votingBallotId].yesWeight -= oldWeight;
            votingMap[votingBallotId].yesWeight += newWeight;
        } else {
            votingMap[votingBallotId].noWeight -= oldWeight;
            votingMap[votingBallotId].noWeight += newWeight;
        }
    }

    /// @dev This function will be called when either user is transferring the tokens to other account,
    /// or is receiving tokens from other tokens.
    /// @param user address of the user whose balance is being changed
    /// @param previousBalance this is the old balance of the user
    /// @param newBalance this is the new balance of the user that is after the transfer
    function _handleUserTokenTransfers(
        address user,
        uint256 tokenId,
        uint256 previousBalance,
        uint256 newBalance
    ) public virtual {
        uint256[] storage ballotList = userActiveVotedBallots[user];
        for (uint256 i = 0; i < ballotList.length; i++) {
            if (
                votingMap[ballotList[i]].isResultDeclared == true ||
                votingMap[ballotList[i]].votingEndBlock < block.number
            ) {
                // Deleting the ballot if result is declared
                ballotList[i] = ballotList[ballotList.length - 1];
                ballotList.pop();
                if (i == 0) {
                    i = 0;
                } else {
                    i--;
                }
            } else if (tokenId == votingMap[ballotList[i]].tokenId) {
                // Changing the weighage of the votes of user
                _changeVoteWeight(
                    ballotList[i],
                    user,
                    previousBalance,
                    newBalance
                );
            }
        }
    }

    /// @dev This function is called by any user to cast vote
    /// @param votingBallotId this is the id of the ballot for which we need to find the winner
    function _declareWinner(uint256 votingBallotId)
        internal
        returns (bool isWinner)
    {
        require(
            votingMap[votingBallotId].isPresent == true,
            "No ballot with your id is found"
        );

        require(
            votingMap[votingBallotId].votingEndBlock < block.number,
            "Voting time is not over yet"
        );

        require(
            votingMap[votingBallotId].isResultDeclared == false,
            "Result already declared"
        );

        VotingBallot storage votingBallot = votingMap[votingBallotId];
        uint256 totalYes = votingBallot.yesWeight;

        // Currently to win you would need to around 66% of votes to be yes
        TreasuryContract treasuryContract = TreasuryContract(
            TREASURY_CONTRACT_ADDRESS
        );

        votingMap[votingBallotId].isResultDeclared = true;

        if (totalYes > 0) {
            uint256 totalCirculatingSupply = treasuryContract
                .totalCirculatingSupply(votingBallot.tokenId);

            //calculating the 2/3rd value of totalCirculatingSupply to identify how much we will need to win
            uint256 winAmount = (totalCirculatingSupply * 66) / 100;

            //This will check for 2 / 3 ratio for yes votes
            if (totalYes > winAmount) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
}
