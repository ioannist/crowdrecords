// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Voting/BaseVotingContract.sol";
import "./TreasuryContract.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract DilutionContract is BaseVotingContract {
    //Event
    // == Create
    // == vote
    // == result
    //Dilution data storage
    //Dilution mapping, id => data
    //Dilution request creation
    //Dilution voting
    //Dilution result

    /**
        @dev This will contain the data for the dilution request
        @param requester the person who has requested for token dilution
        @param recordId This is the id of the record that is linked to this ballot 
        @param dilutionId This is the id of the dilution structure that is linked to this ballot 
        @param ballotId Id of the ballot where voting is stored
        @param tokenId token that is to be minted
        @param amount the amount of tokens to be minted
        @param isPresent State of vote : true for yes and false for No
        @param isAccepted State of vote : true for yes and false for No
     */
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

    /**
        @dev This is when a dilution request is created.
        @param requester the person who has requested for token dilution
        @param recordId This is the id of the record that is linked to this ballot 
        @param dilutionId This is the id of the dilution structure that is linked to this ballot 
        @param ballotId Id of the ballot where voting is stored
        @param tokenId token that is to be minted
        @param amount the amount of tokens to be minted
     */
    event DilutionRequestCreated(
        address requester,
        uint256 recordId,
        uint256 dilutionId,
        uint256 ballotId,
        uint256 tokenId,
        uint256 amount
    );

    /**
        @dev This is when a vote is given by user.
        @param voter Address of the voter
        @param dilutionId This is the id of the dilution structure that is linked to this ballot 
        @param ballotId Id of the ballot where voting is stored
        @param vote State of vote : true for yes and false for No
     */
    event DilutionVoting(
        address voter,
        uint256 dilutionId,
        uint256 ballotId,
        bool vote
    );

    /**
        @dev this event is generated when result of a ballot is declared
        @param dilutionId This is the id of dilution request
        @param tokenId This is the id of the contribution that is linked to this ballot 
        @param ballotId this is the ballot Id for which result is declared 
        @param result this is the status of the result //either true if user won that is he received more than 66% of votes or false if user lost 
     */
    event DilutionResult(
        uint256 dilutionId,
        uint256 tokenId,
        uint256 ballotId,
        bool result
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

    constructor(uint8 votingInterval, uint256 requestInterval)
        BaseVotingContract()
    {
        VOTING_BLOCK_PERIOD = votingInterval;
        REQUEST_INTERVAL = requestInterval;
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
     * @dev This function will create a new contribution voting ballot
     */
    function createDilutionRequest(
        uint256 recordId,
        uint256 tokenId,
        uint256 amount
    ) public {
        require(
            activeDilutionRequestMap[tokenId] == 0,
            "There is a pending dilution request"
        );

        TreasuryContract treasuryContract = TreasuryContract(
            TREASURY_CONTRACT_ADDRESS
        );

        uint256 commTokenId = treasuryContract.getCommunityTokenId(recordId);
        uint256 govTokenId = treasuryContract.getGovernanceTokenId(recordId);

        require(
            govTokenId == tokenId || commTokenId == tokenId,
            "Invalid token or record"
        );

        require(
            treasuryContract.balanceOf(msg.sender, tokenId) > 0,
            "You cannot create dilution request"
        );

        // We need to check if there were any previous request made,
        // and if any request are made then has sufficient time passed or not.
        // If the block number is 0 then it means that no request has been created
        require(
            lastDilutionResultMap[tokenId] == 0 ||
                lastDilutionResultMap[tokenId] + REQUEST_INTERVAL <
                block.number,
            "You need to wait sometime for you create new dilution request"
        );

        _dilutionIds.increment();
        uint256 dilutionId = _dilutionIds.current();
        uint256 ballotId = _createVoting(true, commTokenId);

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

    /**
     * @dev This function is called by any user to cast vote
     * @param dilutionId this is the id of the dilution request for which user is voting
     * @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot
     */
    function castVote(uint256 dilutionId, bool vote) public {
        require(
            dilutionRequestMap[dilutionId].isPresent == true,
            "Invalid dilution request id"
        );

        emit DilutionVoting({
            dilutionId: dilutionId,
            ballotId: dilutionRequestMap[dilutionId].ballotId,
            voter: msg.sender,
            vote: vote
        });

        super._castVote(dilutionRequestMap[dilutionId].ballotId, vote);
    }

    /**
     * @dev This function can be called from external source and also from within the contract
     * @param dilutionId this is the id of the contribution to which the winner is to be decleared
     */
    function declareWinner(uint256 dilutionId) external {
        bool result = _declareWinner(dilutionRequestMap[dilutionId].ballotId);

        emit DilutionResult({
            dilutionId: dilutionId,
            tokenId: dilutionRequestMap[dilutionId].tokenId,
            ballotId: dilutionRequestMap[dilutionId].ballotId,
            result: result
        });

        if (result) {
            //Transfer the reward amount to user
            TreasuryContract treasuryContract = TreasuryContract(
                TREASURY_CONTRACT_ADDRESS
            );
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
