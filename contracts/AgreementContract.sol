// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./voting/BaseVotingContract.sol";
import "./TreasuryContract.sol";

contract AgreementContract is BaseVotingContract {
    //This is the struct that contains the publishing agreement data
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

    event RoyaltyPayment(
        uint256 agreementId,
        uint256 recordId,
        uint256 totalSupplyEther,
        uint256 dividendAmountWei,
        uint256 dividendId,
        uint256 tokenId,
        uint256 dividendPerTokenWei,
        uint256 snapshotId
    );

    event RoyaltyPaymentClaimed(
        uint256 agreementId,
        uint256 dividendId,
        uint256 recordId,
        uint256 rewardAmount,
        address userAddress
    );

    struct DividendData {
        uint256 totalSupplyEther;
        uint256 dividendAmountWei;
        uint256 dividendId;
        uint256 tokenId;
        uint256 dividendPerTokenWei;
        uint256 snapshotId;
    }

    /**
        @dev This is when a user votes for a publishing agreement
        @param voter Address of the voter
        @param agreementId This is the id of the publishing agreement that is linked to this ballot 
        @param ballotId Id of the ballot where voting is stored
        @param vote State of vote : true for yes and false for No
     */
    event AgreementVoting(
        address voter,
        uint256 agreementId,
        uint256 ballotId,
        bool vote
    );

    /**
        @dev this event is generated when result of a ballot is declared
        @param agreementId This is the id of the agreement that is linked to this ballot 
        @param ballotId this is the ballot Id for which result is declared 
        @param result this is the status of the result //either true if user won that is he received more than 66% of votes or false if user lost 
     */
    event BallotResult(uint256 agreementId, uint256 ballotId, bool result);

    uint256 public agreementCurrentId = 0;
    mapping(uint256 => Agreement) agreementMap;
    //The below mapping contains the list of agreementId
    // mapping works as (recordId => [agreementId])
    mapping(uint256 => uint256[]) recordAgreementList;

    uint256 dividendId = 0;
    //agreementId => array of dividends
    mapping(uint256 => uint256[]) dividendListMapping;
    //Dividend id => dividend data
    mapping(uint256 => DividendData) dividendDataMapping;
    //dividendId => userAddress => bool
    mapping(uint256 => mapping(address => bool)) dividendClaimMapping;

    constructor(uint8 votingInterval) BaseVotingContract() {
        VOTING_BLOCK_PERIOD = votingInterval;
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
     * @dev This function will create a new agreement voting ballot
     */
    function createAgreement(
        uint256 recordId,
        string memory contractLink,
        string memory contractHash
    ) public returns (uint256) {
        //Check if valid record id
        agreementCurrentId++;
        uint256 agreeId = agreementCurrentId;

        uint256 ballotId = _createVoting(true);

        TreasuryContract treasuryContract = TreasuryContract(
            TREASURY_CONTRACT_ADDRESS
        );
        uint256 tokenId = treasuryContract.getGovernanceTokenId(recordId);

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

    /**
     * @dev This function is called by any user to cast vote
     * @param agreementId this is the id of the agreement for which user is voting
     * @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot
     */
    function castVoteForAgreement(uint256 agreementId, bool vote) public {
        super._castVote(agreementMap[agreementId].ballotId, vote);

        emit AgreementVoting({
            agreementId: agreementId,
            ballotId: agreementMap[agreementId].ballotId,
            voter: tx.origin,
            vote: vote
        });
    }

    //Deciding the winner

    /**
     * @dev This function can be called from external source and also from within the contract
     * @param agreementId this is the id of the agreement of which the winner is to be decleared
     */
    function declareWinner(uint256 agreementId) external {
        bool result = _declareWinner(
            agreementMap[agreementId].ballotId,
            agreementMap[agreementId].tokenId
        );

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

    //-------------------------TEST----------------------------//

    /**
     * @dev This function is for testing purpose for distributing the royalty payment
     */
    function payRoyaltyAmount(
        /* uint256 recordId, */
        uint256 agreementId,
        uint256 amount
    ) public {
        require(agreementMap[agreementId].isActive, "Invalid agreement id");
        uint256 recordId = agreementMap[agreementId].recordId;
        dividendId += 1;
        TreasuryContract treasuryContract = TreasuryContract(
            TREASURY_CONTRACT_ADDRESS
        );
        uint256 tokenId = treasuryContract.getCommunityTokenId(recordId);
        uint256 totalSupply = treasuryContract.totalCirculatingSupply(tokenId);

        treasuryContract.safeTransferFrom(
            msg.sender,
            address(this),
            treasuryContract.CRD(),
            amount,
            "Royalty payment transfer"
        );

        DividendData memory dividend = DividendData({
            totalSupplyEther: totalSupply / 1 ether,
            dividendAmountWei: amount,
            dividendId: dividendId,
            dividendPerTokenWei: amount / (totalSupply / 1 ether),
            tokenId: tokenId,
            snapshotId: treasuryContract.snapshot()
        });

        require(
            dividend.dividendPerTokenWei > 0,
            "Insufficient amount, please try again with greater amount"
        );

        emit RoyaltyPayment({
            agreementId: agreementId,
            recordId: recordId,
            totalSupplyEther: dividend.totalSupplyEther,
            dividendAmountWei: dividend.dividendAmountWei,
            dividendId: dividend.dividendId,
            tokenId: dividend.tokenId,
            dividendPerTokenWei: dividend.dividendPerTokenWei,
            snapshotId: dividend.snapshotId
        });

        dividendListMapping[agreementId].push(dividendId);
        dividendDataMapping[dividendId] = dividend;
    }

    /**
     * @dev This function is for testing purpose for distributing the royalty payment
     */
    function claimRoyaltyAmount(uint256 agreementId) public {
        uint256[] memory dividendIdArray = dividendListMapping[agreementId];
        uint256 recordId = agreementMap[agreementId].recordId;

        require(dividendIdArray.length > 0, "No royalty payments created yet");

        uint256 newClaimIndex = _getNewClaimIndex(dividendIdArray, msg.sender);
        require(
            newClaimIndex >= 0 && newClaimIndex < dividendIdArray.length,
            "You have no pending claims"
        );

        TreasuryContract treasuryContract = TreasuryContract(
            TREASURY_CONTRACT_ADDRESS
        );

        uint256 tokenId = treasuryContract.getCommunityTokenId(recordId);
        uint256 totalReward = 0;

        require(
            dividendClaimMapping[dividendIdArray[newClaimIndex]][msg.sender] ==
                false,
            "Can only claim once"
        );

        for (; newClaimIndex < dividendIdArray.length; newClaimIndex++) {
            uint256 rewardAmount = _calculateSingleRoyaltyAmount(
                dividendIdArray[newClaimIndex],
                tokenId
            );

            emit RoyaltyPaymentClaimed({
                dividendId: dividendIdArray[newClaimIndex],
                recordId: recordId,
                agreementId: agreementId,
                rewardAmount: rewardAmount,
                userAddress: msg.sender
            });

            uint256 index = dividendIdArray[newClaimIndex];
            dividendClaimMapping[index][msg.sender] = true;

            totalReward = rewardAmount + totalReward;
        }

        //If the total is not bigger then 0 then it means that user doesn't have any pending claim
        // require(totalReward > 0, "You have no pending claims");

        /**
            //! When you uncomment the below code then it just causes the crash without a proper reason, here we expect crash to return "You have no pending claims" but instead it just throws error with
            -Transaction: 0x5896b98d557a472e4f0063783b9e8bcf8ce7982de710c1c3c69c727e9989066a exited with an error (status 0) after consuming all gas.
            -     Please check that the transaction:
            -     - satisfies all conditions set by Solidity `assert` statements.
            -     - has enough gas to execute the full transaction.
            -     - does not trigger an invalid opcode by other means (ex: accessing an array out of bounds).
       */
        // require(false, "You have no pending claims");

        treasuryContract.safeTransferFrom(
            address(this),
            msg.sender,
            treasuryContract.CRD(),
            totalReward,
            "Royalty payment claim"
        );
    }

    /**
     * @dev This function is for testing purpose for distributing the royalty payment
     */
    function _calculateSingleRoyaltyAmount(uint256 diviId, uint256 tokenId)
        internal
        view
        returns (uint256)
    {
        DividendData memory dividend = dividendDataMapping[diviId];
        TreasuryContract treasuryContract = TreasuryContract(
            TREASURY_CONTRACT_ADDRESS
        );

        uint256 tokenBal = treasuryContract.balanceOfAt(
            msg.sender,
            dividend.snapshotId,
            tokenId
        );

        if (tokenBal == 0) {
            return 0;
        }

        return dividend.dividendPerTokenWei * (tokenBal / 1 ether);
    }

    /**
     * @dev
     */
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
            uint256 mid = Math.average(low, high);
            lastClaimedDividendId = dividendIdArray[mid];
            bool claimStatus = dividendClaimMapping[lastClaimedDividendId][
                user
            ];

            //If claimStatus is false then it means that there are some elements that are yet to be claimed so we will go
            //down and search there
            if (!claimStatus && high != mid) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }

        if (
            low > 0 &&
            dividendClaimMapping[dividendIdArray[low - 1]][user] == false
        ) return low - 1;
        else if (
            low < dividendIdArray.length &&
            dividendClaimMapping[dividendIdArray[low]][user] == true
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
