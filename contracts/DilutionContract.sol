// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Voting/BaseVotingContract.sol";
import "./interface/ITreasury.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract DilutionContract is BaseVotingContract {
    /// @dev This will contain the data for the dilution request
    /// @param requester the person who has requested for token dilution
    /// @param recordId This is the id of the record that is linked to this ballot
    /// @param dilutionId This is the id of the dilution structure that is linked to this ballot
    /// @param ballotId Id of the ballot where voting is stored
    /// @param tokenId token that is to be minted
    /// @param amount the amount of tokens to be minted
    /// @param isPresent this is to check if the dilution request is present or not
    /// @param isAccepted this denotes the status of the request that is if the request was accepted or rejected
    struct DilutionRequest {
        address requester;
        uint256 recordId;
        uint256 dilutionId;
        uint256 ballotId;
        uint256 tokenId;
        uint256 amount;
        bool isPresent;
        bool isAccepted;
    }

    /// @dev This is when a dilution request is created.
    /// @param requester the person who has requested for token dilution
    /// @param recordId This is the id of the record that is linked to this ballot
    /// @param dilutionId This is the id of the dilution structure that is linked to this ballot
    /// @param ballotId Id of the ballot where voting is stored
    /// @param tokenId token that is to be minted
    /// @param amount the amount of tokens to be minted
    event DilutionRequestCreated(
        address requester,
        uint256 recordId,
        uint256 dilutionId,
        uint256 ballotId,
        uint256 tokenId,
        uint256 amount
    );

    /// @dev This is when a vote is given by user.
    /// @param voter Address of the voter
    /// @param dilutionId This is the id of the dilution structure that is linked to this ballot
    /// @param ballotId Id of the ballot where voting is stored
    /// @param vote State of vote : true for yes and false for No
    event DilutionVoting(
        address voter,
        uint256 dilutionId,
        uint256 ballotId,
        bool vote
    );

    /// @dev this event is generated when result of a ballot is declared
    /// @param dilutionId This is the id of dilution request
    /// @param tokenId This is the id of the contribution that is linked to this ballot
    /// @param ballotId this is the ballot Id for which result is declared
    /// @param result this is the status of the result,
    /// @param minTurnOut this status indicates if minimum amount of user showed up for voting
    /// either true if user won that is he received more than 66% of votes or false if user lost
    event DilutionResult(
        uint256 dilutionId,
        uint256 tokenId,
        uint256 ballotId,
        bool result,
        bool minTurnOut
    );

    using Counters for Counters.Counter;
    Counters.Counter private _dilutionIds;

    // This mapping contains data with respect to dilution id
    // _dilutionId => dilutionData
    mapping(uint256 => DilutionRequest) dilutionRequestMap;

    // This mapping tracks if any request for dilution is active or not
    // tokenId => id of the current dilution request, if 0 then there are no active dilution request
    mapping(uint256 => uint256) public activeDilutionRequestMap;

    // This mapping contains the blocknumber when last request for dilution request result of distributed
    // tokenId => blocknumber when last dilution result was declared for this token
    mapping(uint256 => uint256) public lastDilutionResultMap;

    uint256 public REQUEST_INTERVAL;

    constructor(
        uint8 votingInterval,
        uint256 requestInterval,
        address owner
    ) BaseVotingContract(owner) {
        VOTING_BLOCK_PERIOD = votingInterval;
        REQUEST_INTERVAL = requestInterval;
    }

    /// @dev This is to set the address of the contracts
    /// @param newTreasuryContractAddress This is the address of new treasury contract
    /// @param newGovernanceContractAddress This is the address for the governance contract
    function initialize(
        address newTreasuryContractAddress,
        address newGovernanceContractAddress
    ) public override initializer _ownerOnly {
        BaseVotingContract.initialize(
            newTreasuryContractAddress,
            newGovernanceContractAddress
        );
    }

    /// @dev This function will create a new contribution voting ballot
    /// @param recordId this is the id of the record whose dilution request is to be created
    /// @param tokenId the token that needs to be diluted
    /// @param amount the amount to be diluted
    function createDilutionRequest(
        uint256 recordId,
        uint256 tokenId,
        uint256 amount
    ) public payable {
        require(
            activeDilutionRequestMap[tokenId] == 0,
            "INVALID: PENDING_DILUTION_REQUEST"
        );

        ITreasury treasuryContract = ITreasury(TREASURY_CONTRACT_ADDRESS);

        uint256 commTokenId = treasuryContract.getCommunityTokenId(recordId);
        uint256 govTokenId = treasuryContract.getGovernanceTokenId(recordId);

        require(
            govTokenId == tokenId || commTokenId == tokenId,
            "INVALID: TOKEN_OR_RECORD"
        );

        require(
            treasuryContract.balanceOf(msg.sender, tokenId) > 0,
            "INVALID: NO_TOKENS_FOUND"
        );

        // We need to check if there were any previous request made,
        // and if any request are made then has sufficient time passed or not.
        // If the block number is 0 then it means that no request has been created
        // err: You need to wait sometime for you create new dilution request
        require(
            lastDilutionResultMap[tokenId] == 0 ||
                lastDilutionResultMap[tokenId] + REQUEST_INTERVAL <
                block.number,
            "INVALID: WAIT_SOMETIME_BEFORE_NEW_DILUTION_REQUEST"
        );

        _dilutionIds.increment();
        uint256 dilutionId = _dilutionIds.current();
        uint256 ballotId = _createVoting(true, commTokenId);
        _createDeposit(tx.origin, ballotId);

        DilutionRequest memory dilutionRequest = DilutionRequest({
            requester: msg.sender,
            recordId: recordId,
            dilutionId: dilutionId,
            ballotId: ballotId,
            tokenId: tokenId,
            amount: amount,
            isPresent: true,
            isAccepted: false
        });

        emit DilutionRequestCreated({
            requester: dilutionRequest.requester,
            recordId: dilutionRequest.recordId,
            dilutionId: dilutionRequest.dilutionId,
            ballotId: dilutionRequest.ballotId,
            tokenId: dilutionRequest.tokenId,
            amount: dilutionRequest.amount
        });

        dilutionRequestMap[dilutionId] = dilutionRequest;
    }

    /// @dev This function is called by any user to cast vote
    /// @param dilutionId this is the id of the dilution request for which user is voting
    /// @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot
    function castVote(uint256 dilutionId, bool vote) public {
        require(
            dilutionRequestMap[dilutionId].isPresent == true,
            "INVALID: INVALID_DILUTiON_ID"
        );

        emit DilutionVoting({
            dilutionId: dilutionId,
            ballotId: dilutionRequestMap[dilutionId].ballotId,
            voter: msg.sender,
            vote: vote
        });

        super._castVote(dilutionRequestMap[dilutionId].ballotId, vote);
    }

    /// @dev This function can be called from external source and also from within the contract
    /// @param dilutionId this is the id of the contribution to which the winner is to be decleared
    function declareWinner(uint256 dilutionId) external {
        (bool result, bool minTurnOut) = _declareWinner(
            dilutionRequestMap[dilutionId].ballotId
        );
        _releaseDeposit(dilutionRequestMap[dilutionId].ballotId);

        emit DilutionResult({
            dilutionId: dilutionId,
            tokenId: dilutionRequestMap[dilutionId].tokenId,
            ballotId: dilutionRequestMap[dilutionId].ballotId,
            result: result,
            minTurnOut: minTurnOut
        });

        if (result) {
            //Transfer the reward amount to user
            ITreasury treasuryContract = ITreasury(TREASURY_CONTRACT_ADDRESS);
            treasuryContract.mintTokens(
                dilutionRequestMap[dilutionId].tokenId,
                dilutionRequestMap[dilutionId].amount
            );

            dilutionRequestMap[dilutionId].isAccepted = true;
        } else {
            dilutionRequestMap[dilutionId].isAccepted = false;
        }
        // reset the active dilution to 0
        activeDilutionRequestMap[dilutionRequestMap[dilutionId].tokenId] = 0;
        lastDilutionResultMap[dilutionRequestMap[dilutionId].tokenId] = block
            .number;
    }
}
