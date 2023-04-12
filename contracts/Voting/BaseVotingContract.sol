// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../interface/ITreasury.sol";
import "../OrdersContract.sol";

contract BaseVotingContract is Initializable {
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

    /// @dev this is the voting deposit struct that maintains the record for the deposit made by user for voting
    /// @param owner This is the owner of the voting deposit
    /// @param ballotId This is the id of the voting ballot
    /// @param depositAmount This is the amount of token that are deposited by the user
    /// @param isClaimed This represents if a deposit has been claimed or not
    /// @param isPresent This represents if a deposit has been actually created or not
    struct VotingDeposit {
        address owner;
        uint256 ballotId;
        uint256 depositAmount;
        bool isClaimed;
        bool isPresent;
    }

    /// @dev this will be emitted when a deposit is made
    /// @param owner This is the owner of the voting deposit
    /// @param ballotId This is the id of the voting ballot
    /// @param depositAmount This is the amount of token that are deposited by the user
    /// @param isClaimed This represents if a deposit has been claimed or not
    /// @param isPresent This represents if a deposit has been actually created or not
    event DepositCreated(
        address owner,
        uint256 ballotId,
        uint256 depositAmount,
        bool isClaimed,
        bool isPresent
    );

    /// @dev this will be emitted when the user makes claim
    /// @param owner This is the owner of the voting deposit
    /// @param ballotId This is the id of the voting ballot
    /// @param depositAmount This is the amount of token that are deposited by the user
    event DepositClaimed(
        address owner,
        uint256 ballotId,
        uint256 depositAmount
    );

    uint256 public VOTING_DEPOSIT = 1 ether;
    uint256 public VOTING_BLOCK_PERIOD = 25;
    uint256 public MIN_TURNOUT_PERCENT = 500;
    address public TREASURY_CONTRACT_ADDRESS;
    address public TREASURY_HUB_ADDRESS;
    address public OWNER;
    address public GOVERNANCE;

    uint256 votingId = 0;
    mapping(uint256 => VotingBallot) public votingMap;
    //This mapping tracks the state of user, that is if they have voted already or not.
    // Ballot id => user address => bool
    mapping(uint256 => mapping(address => bool)) alreadyVoted;
    //This mapping is useful if the user has voted, as this hold if user voted yes or no for a specific ballot,
    mapping(uint256 => mapping(address => bool)) userVotes;

    //This mapping keeps the record for the deposit for the voting ballot
    mapping(uint256 => VotingDeposit) public depositMap;

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
            "INVALID: BALLOT_NOT_FOUND"
        );

        require(
            votingMap[votingBallotId].votingEndBlock > block.number,
            "INVALID: VOTING_TIME_OVER"
        );

        require(
            alreadyVoted[votingBallotId][voter] == false,
            "INVALID: ALREADY_VOTED"
        );

        _;
    }

    /// @dev Modifier to check that the person who accesses a specific function is the owner himself.
    modifier _ownerOnly() {
        require(msg.sender == OWNER, "UNAUTHORIZED: CANNOT_PERFORM_ACTION");
        _;
    }

    /// @dev Modifier to check that the function is only accessible by governance.
    modifier _governanceOnly() {
        require(msg.sender == GOVERNANCE, "UNAUTHORIZED: ONLY_GOVERNANCE");
        _;
    }

    /// @dev This modifier checks if a ballot is open for voting or has the time expired
    /// @param votingBallotId This is the id of the ballot which we are checking
    modifier _checkIfOwnerAllowed(uint256 votingBallotId) {
        if (votingMap[votingBallotId].canOwnerVote) {
            require(
                alreadyVoted[votingBallotId][tx.origin] == false,
                "INVALID: ALREADY_VOTED"
            );
        } else if (tx.origin == votingMap[votingBallotId].owner) {
            revert("UNAUTHORIZED: OWNER_CANNOT_VOTE");
        }
        _;
    }

    /// @dev This function sets the owner address
    /// @param ownerAddress This is the address of the owner
    function setOwnerAddress(address ownerAddress) public _ownerOnly {
        OWNER = ownerAddress;
    }

    /// @dev This function sets the MIN_TURN_OUT percentage
    /// @param minTurnOut This is the new turnout percentage value
    function setMinTurnOut(uint minTurnOut) public _governanceOnly {
        MIN_TURNOUT_PERCENT = minTurnOut;
    }

    /// @dev This function sets the VOTING_DEPOSIT percentage
    /// @param depositAmount This is the new deposit amount needed for creating ballot
    function setDepositAmount(uint depositAmount) public _governanceOnly {
        VOTING_DEPOSIT = depositAmount;
    }

    /// @dev This function sets the VOTING_BLOCK_PERIOD percentage
    /// @param votingPeriod This is the voting period
    function setVotingPeriod(uint votingPeriod) public _governanceOnly {
        VOTING_BLOCK_PERIOD = votingPeriod;
    }

    /// @dev This function is called by user to creata a new voting
    /// @param canOwnerVote this is if a user can vote in a voting which he created
    /// @param tokenId This is the id of the token using which voting can be done
    function _createVoting(
        bool canOwnerVote,
        uint256 tokenId
    ) internal returns (uint256) {
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

    /// @dev This function sets the treasury Contract address and the governance address
    /// @param newTreasuryContractAddress This is the new address of treasury contract
    /// @param newGovernanceContractAddress This is the address for the governance contract
    function initialize(
        address newTreasuryContractAddress,
        address newGovernanceContractAddress
    ) public virtual onlyInitializing {
        TREASURY_CONTRACT_ADDRESS = newTreasuryContractAddress;
        GOVERNANCE = newGovernanceContractAddress;
    }

    /// @dev This function is called by any user to cast vote
    /// @param votingBallotId this is the id of the ballot for which user is voting
    /// @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot
    function _castVote(
        uint256 votingBallotId,
        bool vote
    )
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
        ITreasury treasuryContract = ITreasury(TREASURY_CONTRACT_ADDRESS);
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
            "INVALID: INTERNAL: USER_HAS_NOT_VOTED"
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
    function _declareWinner(
        uint256 votingBallotId
    ) internal returns (bool isWinner, bool minTurnOut) {
        require(
            votingMap[votingBallotId].isPresent == true,
            "INVALID: BALLOT_NOT_FOUND"
        );

        require(
            votingMap[votingBallotId].votingEndBlock < block.number,
            "INVALID: VOTING_TIME_NOT_OVER"
        );

        require(
            votingMap[votingBallotId].isResultDeclared == false,
            "INVALID: RESULT_ALREADY_DECLARED"
        );

        VotingBallot storage votingBallot = votingMap[votingBallotId];
        uint256 totalYes = votingBallot.yesWeight;
        uint256 totalNo = votingBallot.noWeight;

        // Currently to win you would need to around 66% of votes to be yes
        ITreasury treasuryContract = ITreasury(TREASURY_CONTRACT_ADDRESS);

        votingMap[votingBallotId].isResultDeclared = true;

        uint256 totalCirculatingSupply = treasuryContract
            .totalCirculatingSupply(votingBallot.tokenId);

        uint256 minimumTurnOutAmount = ((totalCirculatingSupply *
            MIN_TURNOUT_PERCENT) / 100) / 100;
        if (totalNo + totalYes > minimumTurnOutAmount) {
            if (totalYes > 0) {
                //calculating the 2/3rd value of the votes that were casted to identify how much we will need to win
                uint256 winAmount = ((totalYes + totalNo) * 66) / 100;

                //This will check for 2 / 3 ratio for yes votes
                if (totalYes > winAmount) {
                    return (true, true);
                } else {
                    return (false, true);
                }
            } else {
                return (false, true);
            }
        } else {
            return (false, false);
        }
    }

    /// @dev This function is responsible for transfer of the ether balance
    /// @param owner The owner who is depositing
    /// @param ballotId The id of the ballot for which the deposit is made
    function _createDeposit(address owner, uint256 ballotId) internal {
        require(VOTING_DEPOSIT == msg.value, "INV_DEP");
        VotingDeposit memory votingDeposit = VotingDeposit({
            owner: owner,
            ballotId: ballotId,
            depositAmount: VOTING_DEPOSIT,
            isClaimed: false,
            isPresent: true
        });
        emit DepositCreated(
            votingDeposit.owner,
            votingDeposit.ballotId,
            votingDeposit.depositAmount,
            votingDeposit.isClaimed,
            votingDeposit.isPresent
        );
        depositMap[ballotId] = votingDeposit;
    }

    event DEBUG(uint value);

    /// @dev This function is responsible releasing the ether balance that was taken as deposit
    /// @param ballotId The id of the ballot for which the deposit is made
    function _releaseDeposit(uint256 ballotId) internal {
        require(depositMap[ballotId].isPresent == true, "DEP_NOT_EXIST");
        require(depositMap[ballotId].isClaimed == false, "DEP_ALREADY_CLAIMED");

        (bool sent, ) = payable(depositMap[ballotId].owner).call{
            value: depositMap[ballotId].depositAmount
        }("");

        require(sent, "INV_DEP_CLAIM");

        emit DepositClaimed(
            depositMap[ballotId].owner,
            ballotId,
            depositMap[ballotId].depositAmount
        );
    }
}
