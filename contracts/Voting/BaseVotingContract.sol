// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../TreasuryContract.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../OrdersContract.sol";

contract BaseVotingContract {
    struct VotingBallot {
        address owner;
        address[] yes;
        address[] no;
        uint256 votingEndBlock;
        bool isResultDeclared;
        bool canOwnerVote;
        bool isPresent;
    }

    uint256 VOTING_BLOCK_PERIOD = 25;
    address public TREASURY_CONTRACT_ADDRESS;
    // address public ORDER_CONTRACT_ADDRESS;
    address OWNER;

    uint256 votingId = 0;
    mapping(uint256 => VotingBallot) votingMap;
    mapping(uint256 => mapping(address => bool)) alreadyVoted;

    constructor() {
        OWNER = msg.sender;
    }

    /**
     * @dev This modifier checks if a ballot is open for voting or has the time expired
     */
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

    /**
     * @dev Modifier to check that the person who accesses a specific function is the owner himself.
     */
    modifier _ownerOnly() {
        require(msg.sender == OWNER, "You are not authorized for this action");
        _;
    }

    /**
     * @dev This modifier checks if a ballot is open for voting or has the time expired
     */
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

    /**
     * @dev This function is called by user to creata a new voting
     * @param canOwnerVote this is if a user can vote in a voting which he created
     */
    function _createVoting(bool canOwnerVote) internal returns (uint256) {
        votingId++;

        VotingBallot memory voting = VotingBallot({
            owner: tx.origin,
            yes: new address[](0),
            no: new address[](0),
            votingEndBlock: block.number + VOTING_BLOCK_PERIOD,
            isResultDeclared: false,
            canOwnerVote: canOwnerVote,
            isPresent: true
        });

        votingMap[votingId] = voting;
        return votingId;
    }

    /**
     * @dev This function sets the treasury Contract address
     */
    function _setTreasuryContractAddress(address newTreasuryContractAddress)
        internal
        virtual
        _ownerOnly
    {
        TREASURY_CONTRACT_ADDRESS = newTreasuryContractAddress;
    }

    /**
     * @dev This function sets the treasury Contract address
     */
    // function _setOrderContractAddress(address newOrderContractAddress)
    //     internal
    //     virtual
    //     _ownerOnly
    // {
    //     ORDER_CONTRACT_ADDRESS = newOrderContractAddress;
    // }

    /**
     * @dev This function is called by any user to cast vote
     * @param votingBallotId this is the id of the ballot for which user is voting
     * @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot
     */
    function _castVote(uint256 votingBallotId, bool vote)
        internal
        virtual
        _checkIfBallotIsOpen(votingBallotId, msg.sender)
        _checkIfOwnerAllowed(votingBallotId)
    {
        _castVotePrivate(votingBallotId, vote, tx.origin);
    }

    /**
     * @dev This function is called when the vote is casted on later stages such as in counter offer where the vote is reviewd before hand by the user and then it is accepted by the user.
     * @param votingBallotId this is the id of the ballot for which user is voting
     * @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot
     */
    function _castVoteForOther(
        uint256 votingBallotId,
        bool vote,
        address voter
    ) internal _checkIfBallotIsOpen(votingBallotId, voter) {
        _castVotePrivate(votingBallotId, vote, voter);
    }

    /**
     * @dev core logic for voting
     * @param votingBallotId this is the id of the ballot for which user is voting
     * @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot
     * @param voter Voter's address
     */
    function _castVotePrivate(
        uint256 votingBallotId,
        bool vote,
        address voter
    ) private {
        if (vote) {
            votingMap[votingBallotId].yes.push(voter);
        } else {
            votingMap[votingBallotId].no.push(voter);
        }

        alreadyVoted[votingBallotId][voter] = true;
    }

    /**
     * @dev This function is called by any user to cast vote
     * @param votingBallotId this is the id of the ballot for which we need to find the winner
     */
    function _declareWinner(uint256 votingBallotId, uint256 tokenId)
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

        address[] memory yesList = votingMap[votingBallotId].yes;
        uint256[] memory idList = new uint256[](yesList.length);
        for (uint256 i = 0; i < yesList.length; i++) {
            idList[i] = tokenId;
        }

        // Currently to win you would need to around 66% of votes to be yes
        TreasuryContract treasuryContract = TreasuryContract(
            TREASURY_CONTRACT_ADDRESS
        );

        // uint256 tokenInSale = treasuryContract.balanceOf(
        //     ORDER_CONTRACT_ADDRESS,
        //     tokenId
        // );

        uint256[] memory yesBalanceList = treasuryContract.balanceOfBatch(
            votingMap[votingBallotId].yes,
            idList
        );

        uint256 totalYes = 0;
        for (uint256 i = 0; i < yesList.length; i++) {
            totalYes += yesBalanceList[i];
        }

        // uint256[] memory noBalanceList = treasuryContract.balanceOfBatch(
        //     votingMap[votingBallotId].no,
        //     idList
        // );

        // uint256 totalNo = 0;

        // for (uint256 i = 0; i < yesList.length; i++) {
        //     totalNo += noBalanceList[i];
        // }

        votingMap[votingBallotId].isResultDeclared = true;

        if (totalYes > 0) {
            uint256 totalCirculatingSupply = treasuryContract
                .totalCirculatingSupply(tokenId);

            // We will deduct the tokens that are in sale contract fromthe total circulating supply
            // totalCirculatingSupply = totalCirculatingSupply - tokenInSale;

            uint256 winRatio = ((totalYes * 100) / totalCirculatingSupply);

            //This will check for 2 / 3 ratio for yes votes
            if (winRatio > (6600 / 100)) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
}
