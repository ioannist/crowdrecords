// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./voting/BaseVotingContract.sol";
import "./interface/ITreasury.sol";

contract AgreementContract is BaseVotingContract {
    /// @dev This structure will hold the data for agreements
    /// @param requester This is the person who has requested for the agreement
    /// @param recordId This is the record id to which the agreement belongs to
    /// @param ballotId This is the ballot id of the agreement
    /// @param tokenId This is the id of token using which user can vote
    /// @param isActive This is to check if a agreement is active or not
    /// @param contractLink This is the link of the contract file
    /// @param contractHash This is the hash of the contract file
    /// @param creationTime This is the creation time of the contract
    /// @param isPresent This is to check if agreement is present or not
    struct Agreement {
        address requester;
        uint256 recordId;
        uint256 ballotId;
        uint256 tokenId;
        bool isActive;
        string contractLink;
        string contractHash;
        uint256 creationTime;
        bool isPresent;
    }

    /// @dev This event is emmited when a agreement is created.
    /// @param requester This is the person who has requested for the agreement
    /// @param recordId This is the record id to which the agreement belongs to
    /// @param agreementId This is the id of the agreement that was created
    /// @param ballotId This is the ballot id of the agreement
    /// @param tokenId This is the id of token using which user can vote
    /// @param contractLink This is the link of the contract file
    /// @param contractHash This is the hash of the contract file
    /// @param creationTime This is the creation time of the contract
    /// @param isPresent This is to check if agreement is present or not
    event AgreementCreated(
        address requester,
        uint256 recordId,
        uint256 agreementId,
        uint256 ballotId,
        uint256 tokenId,
        string contractLink,
        string contractHash,
        uint256 creationTime,
        bool isPresent
    );

    /// @dev This evet is emitted when as royalty payment is done by a user for a royalty agreement.
    /// @param agreementId This is the id of the agreement that was created
    /// @param recordId This is the record id to which the agreement belongs to
    /// @param totalSupplyEther This is the total amount of tokens that are in circulation in ether value
    /// during the distribution was made
    /// @param royaltyAmountWei This is the amount of royalty that has been paid by user in wei amount
    /// @param royaltyId This is the id of royalty that has been paid
    /// @param tokenId This is the id of tokens that will used to determine the royalty ratio (it is holding tokenid)
    /// @param royaltyPerTokenWei This is how many wei each user will get for each token (token of "tokenId") he holds.
    /// @param snapshotId This is the snapshot id when the user distributed the reward
    event RoyaltyPayment(
        uint256 agreementId,
        uint256 recordId,
        uint256 totalSupplyEther,
        uint256 royaltyAmountWei,
        uint256 royaltyId,
        uint256 tokenId,
        uint256 royaltyPerTokenWei,
        uint256 snapshotId
    );

    /// @dev This event is emitted when a royalty payment is claimed
    /// @param agreementId This is the id of the agreement that was created
    /// @param royaltyId This is the id of royalty that has been paid
    /// @param recordId This is the record id to which the agreement belongs to
    /// @param rewardAmount This is the amount of reward that user claimed
    /// @param userAddress Address of user who claimed the royalty payment
    event RoyaltyPaymentClaimed(
        uint256 agreementId,
        uint256 royaltyId,
        uint256 recordId,
        uint256 rewardAmount,
        address userAddress
    );

    /// @dev This structure holds data of each royalty payment made by user
    /// @param totalSupplyEther This is the total amount of tokens that are in circulation in ether value
    /// @param royaltyAmountWei This is the amount of royalty that has been paid by user in wei amount
    /// @param royaltyId This is the id of royalty that has been paid
    /// @param tokenId This is the id of tokens that will used to determine the royalty ratio (it is holding tokenid)
    /// @param royaltyPerTokenWei This is how many wei each user will get for each token (token of "tokenId") he holds.
    /// @param snapshotId This is the snapshot id when the user distributed the reward
    struct RoyaltyData {
        uint256 totalSupplyEther;
        uint256 royaltyAmountWei;
        uint256 royaltyId;
        uint256 tokenId;
        uint256 royaltyPerTokenWei;
        uint256 snapshotId;
    }

    /// @dev This is when a user votes for a publishing agreement
    /// @param voter Address of the voter
    /// @param agreementId This is the id of the publishing agreement that is linked to this ballot
    /// @param ballotId Id of the ballot where voting is stored
    /// @param vote State of vote : true for yes and false for No
    event AgreementVoting(
        address voter,
        uint256 agreementId,
        uint256 ballotId,
        bool vote
    );

    /// @dev this event is generated when result of a ballot is declared
    /// @param agreementId This is the id of the agreement that is linked to this ballot
    /// @param ballotId this is the ballot Id for which result is declared
    /// @param result this is the status of the result either true if user won that is he received
    ///  more than 66% of votes or false if user lost
    event BallotResult(uint256 agreementId, uint256 ballotId, bool result);

    uint256 public agreementCurrentId = 0;
    mapping(uint256 => Agreement) agreementMap;
    //The below mapping contains the list of agreementId
    // mapping works as (recordId => [agreementId])
    mapping(uint256 => uint256[]) recordAgreementList;

    uint256 royaltyId = 0;
    //agreementId => array of royalties
    mapping(uint256 => uint256[]) royaltyListMapping;
    //Dividend id => dividend data
    mapping(uint256 => RoyaltyData) royaltyDataMapping;
    //royaltyId => userAddress => bool
    mapping(uint256 => mapping(address => bool)) royaltyClaimMapping;

    constructor(uint8 votingInterval, address owner) BaseVotingContract(owner) {
        VOTING_BLOCK_PERIOD = votingInterval;
    }

    /// @dev This function sets the treasury Contract address
    /// @param newTreasuryContractAddress this is the new address of treasury contract
    function setTreasuryContractAddress(address newTreasuryContractAddress)
        external
        _ownerOnly
    {
        _setTreasuryContractAddress(newTreasuryContractAddress);
    }

    /// @dev This function will create a new agreement voting ballot
    /// @param recordId this is the id of record of which we need to create agreement of
    /// @param contractLink this is the link of the agreement contract
    /// @param contractHash this is the hash of the agreement contract file
    function createAgreement(
        uint256 recordId,
        string memory contractLink,
        string memory contractHash
    ) public returns (uint256) {
        //Check if valid record id
        agreementCurrentId++;
        uint256 agreeId = agreementCurrentId;

        ITreasury treasuryContract = ITreasury(TREASURY_CONTRACT_ADDRESS);

        uint256 tokenId = treasuryContract.getGovernanceTokenId(recordId);

        uint256 ballotId = _createVoting(true, tokenId);

        Agreement memory agreement = Agreement({
            requester: tx.origin,
            recordId: recordId,
            ballotId: ballotId,
            tokenId: tokenId,
            isActive: false,
            contractLink: contractLink,
            contractHash: contractHash,
            creationTime: block.timestamp,
            isPresent: true
        });

        emit AgreementCreated({
            requester: tx.origin,
            recordId: recordId,
            ballotId: ballotId,
            agreementId: agreeId,
            tokenId: tokenId,
            contractLink: contractLink,
            contractHash: contractHash,
            creationTime: block.timestamp,
            isPresent: true
        });

        agreementMap[ballotId] = agreement;

        recordAgreementList[recordId].push(agreeId);

        return agreeId;
    }

    /// @dev This function is called by any user to cast vote
    /// @param agreementId this is the id of the agreement for which user is voting
    /// @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot

    function castVoteForAgreement(uint256 agreementId, bool vote) public {
        super._castVote(agreementMap[agreementId].ballotId, vote);

        emit AgreementVoting({
            agreementId: agreementId,
            ballotId: agreementMap[agreementId].ballotId,
            voter: tx.origin,
            vote: vote
        });
    }

    /// @dev This function can be called from external source and also from within the contract
    /// @param agreementId this is the id of the agreement of which the winner is to be decleared
    function declareWinner(uint256 agreementId) external {
        bool result = _declareWinner(agreementMap[agreementId].ballotId);

        emit BallotResult(
            agreementId,
            agreementMap[agreementId].ballotId,
            result
        );

        if (result) {
            agreementMap[agreementId].isActive = true;
        } else {
            agreementMap[agreementId].isActive = false;
        }
    }

    /// @dev This function is for distributing the royalty payment
    /// @param agreementId this is the id of the agreement of which the royalty is paid for
    /// @param amount this is the amount of royalty is being
    function payRoyaltyAmount(uint256 agreementId, uint256 amount) public {
        require(agreementMap[agreementId].isActive, "INVALID: AGREEMENT_ID");
        uint256 recordId = agreementMap[agreementId].recordId;
        royaltyId += 1;
        ITreasury treasuryContract = ITreasury(TREASURY_CONTRACT_ADDRESS);
        uint256 tokenId = treasuryContract.getCommunityTokenId(recordId);
        uint256 totalSupply = treasuryContract.totalCirculatingSupply(tokenId);

        treasuryContract.safeTransferFrom(
            msg.sender,
            address(this),
            treasuryContract.CRD(),
            amount,
            "ROYALTY_PAYMENT_TRANSFER"
        );

        RoyaltyData memory dividend = RoyaltyData({
            totalSupplyEther: totalSupply / 1 ether,
            royaltyAmountWei: amount,
            royaltyId: royaltyId,
            royaltyPerTokenWei: amount / (totalSupply / 1 ether),
            tokenId: tokenId,
            snapshotId: treasuryContract.snapshot()
        });

        require(
            dividend.royaltyPerTokenWei > 0,
            "INSUFFICIENT_AMOUNT: NEED_GREATER_AMOUNT"
        );

        emit RoyaltyPayment({
            agreementId: agreementId,
            recordId: recordId,
            totalSupplyEther: dividend.totalSupplyEther,
            royaltyAmountWei: dividend.royaltyAmountWei,
            royaltyId: dividend.royaltyId,
            tokenId: dividend.tokenId,
            royaltyPerTokenWei: dividend.royaltyPerTokenWei,
            snapshotId: dividend.snapshotId
        });

        royaltyListMapping[agreementId].push(royaltyId);
        royaltyDataMapping[royaltyId] = dividend;
    }

    /// @dev This function is for testing purpose for distributing the royalty payment
    /// @param agreementId this is the agreement Id of which royalty is to be claimed
    function claimRoyaltyAmount(uint256 agreementId) public {
        uint256[] memory dividendIdArray = royaltyListMapping[agreementId];
        uint256 recordId = agreementMap[agreementId].recordId;

        require(dividendIdArray.length > 0, "NO_ROYALTY_PAYMENTS");

        uint256 newClaimIndex = _getNewClaimIndex(dividendIdArray, msg.sender);
        require(
            newClaimIndex >= 0 && newClaimIndex < dividendIdArray.length,
            "NO_PENDING_CLAIMS"
        );

        ITreasury treasuryContract = ITreasury(TREASURY_CONTRACT_ADDRESS);

        uint256 tokenId = treasuryContract.getCommunityTokenId(recordId);
        uint256 totalReward = 0;

        require(
            royaltyClaimMapping[dividendIdArray[newClaimIndex]][msg.sender] ==
                false,
            "INVALID: CAN_ONLY_CLAIM_ONCE"
        );

        for (; newClaimIndex < dividendIdArray.length; newClaimIndex++) {
            uint256 rewardAmount = _calculateSingleRoyaltyAmount(
                dividendIdArray[newClaimIndex],
                tokenId
            );

            emit RoyaltyPaymentClaimed({
                royaltyId: dividendIdArray[newClaimIndex],
                recordId: recordId,
                agreementId: agreementId,
                rewardAmount: rewardAmount,
                userAddress: msg.sender
            });

            uint256 index = dividendIdArray[newClaimIndex];
            royaltyClaimMapping[index][msg.sender] = true;

            totalReward = rewardAmount + totalReward;
        }

        //If the total is not bigger then 0 then it means that user doesn't have any pending claim
        // require(totalReward > 0, "NO_PENDING_CLAIMS");

        /**
            //! When you uncomment the below code then it just causes the crash without a proper reason, here we expect crash to return "NO_PENDING_CLAIMS" but instead it just throws error with
            -Transaction: 0x5896b98d557a472e4f0063783b9e8bcf8ce7982de710c1c3c69c727e9989066a exited with an error (status 0) after consuming all gas.
            -     Please check that the transaction:
            -     - satisfies all conditions set by Solidity `assert` statements.
            -     - has enough gas to execute the full transaction.
            -     - does not trigger an invalid opcode by other means (ex: accessing an array out of bounds).
       */
        // require(false, "NO_PENDING_CLAIMS");

        treasuryContract.safeTransferFrom(
            address(this),
            msg.sender,
            treasuryContract.CRD(),
            totalReward,
            "INVALID: ROYALTY_ALREADY_CLAIMED"
        );
    }

    /// @dev This function is for testing purpose for distributing the royalty payment
    /// @param royaltyId This is the id of royalty that user wants to claim
    /// @param tokenId this is the id of token that determines the royalty amount
    function _calculateSingleRoyaltyAmount(uint256 royaltyId, uint256 tokenId)
        internal
        view
        returns (uint256)
    {
        RoyaltyData memory dividend = royaltyDataMapping[royaltyId];
        ITreasury treasuryContract = ITreasury(TREASURY_CONTRACT_ADDRESS);

        uint256 tokenBal = treasuryContract.balanceOfAt(
            msg.sender,
            dividend.snapshotId,
            tokenId
        );

        if (tokenBal == 0) {
            return 0;
        }

        return dividend.royaltyPerTokenWei * (tokenBal / 1 ether);
    }

    /// @dev This function calculates the royalty claim index
    /// @param dividendIdArray This is the array of royalties for a single user
    /// @param user this address of user whose royalty claim index needs to be identified
    function _getNewClaimIndex(uint256[] memory dividendIdArray, address user)
        internal
        view
        returns (uint256)
    {
        if (dividendIdArray.length == 0) {
            return 0;
        }

        uint256 low = 0;
        uint256 high = dividendIdArray.length;
        uint256 lastClaimedDividendId = 0;
        while (low < high) {
            uint256 mid = (low + high) / 2;
            lastClaimedDividendId = dividendIdArray[mid];
            bool claimStatus = royaltyClaimMapping[lastClaimedDividendId][user];

            //If claimStatus is false then it means that there are some elements that are yet to be claimed
            //so we will go down and search there
            if (!claimStatus && high != mid) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }

        if (
            low > 0 &&
            royaltyClaimMapping[dividendIdArray[low - 1]][user] == false
        ) return low - 1;
        else if (
            low < dividendIdArray.length &&
            royaltyClaimMapping[dividendIdArray[low]][user] == true
        ) return low + 1;
        else return low;
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external virtual returns (bytes4) {
        return
            bytes4(
                keccak256(
                    "onERC1155Received(address,address,uint256,uint256,bytes)"
                )
            );
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external virtual returns (bytes4) {
        return
            bytes4(
                keccak256(
                    "onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"
                )
            );
    }
}
