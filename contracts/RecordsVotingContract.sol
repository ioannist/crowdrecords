pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "./interface/IContribution.sol";
import "./Voting/BaseVotingContract.sol";
import "./interface/ITreasury.sol";
import "./interface/ITreasuryCore.sol";
import "./RecordsContract.sol";

contract RecordsVotingContract is BaseVotingContract, IERC1155Receiver {
    uint256 newVersionRequestId = 0;

    // This mapping holds the data of new record version requests
    mapping(uint256 => NewVersionRequest) public newVersionRequestMap;

    // This mapping holds the the status of the claiming of the reward
    // versionId => user address => status
    mapping(uint256 => mapping(address => bool)) public rewardsClaimed;

    // Address of the treasury core contracts
    address public TREASURY_CORE_CONTRACT_ADDRESS;

    // Address of the records contract
    address public RECORDS_CONTRACT_ADDRESS;

    /// @dev This is the token data for new version of record
    /// @param totalSupply This is the total amount of tokens that will be created
    /// @param oldContributorShare This is the amount of token that will be distributed among the previous record owners
    /// @param userBalance Amount of tokens that user will keep to himself
    /// @param symbol Symbol for the token
    /// @param image Image for the token
    struct NewVersionTokenStruct {
        uint256 totalSupply;
        uint256 oldContributorShare;
        uint256 userBalance;
        string symbol;
        string image;
    }

    /// @dev This struct holds the data for new record version request
    /// @param recordData Data for the new record
    /// @param governanceToken New token data for governance token
    /// @param communityToken New token data for community token
    /// @param requester Owner of the request
    /// @param oldVersionId Record id of old version
    /// @param tokenId id of the token which will be used for voting
    /// @param ballotId Id of the voting ballot
    /// @param isPresent This is to check if the request with id is present or not
    /// @param isAccepted The is the status of record that is accepted or not
    struct NewVersionRequest {
        RecordsContract.RecordStruct recordData;
        NewVersionTokenStruct governanceToken;
        NewVersionTokenStruct communityToken;
        uint256[] contributionIds;
        address requester;
        uint256 oldVersionId;
        uint256 tokenId;
        uint256 ballotId;
        bool isPresent;
        bool isAccepted;
    }

    /// @dev This event is generated when New Record Version is created
    /// @param requestId This is the id of the new record version request
    /// @param recordData Data for the new record
    /// @param governanceToken New token data for governance token
    /// @param communityToken New token data for community token
    /// @param requester Owner of the request
    /// @param oldVersionId Record id of old version
    /// @param tokenId id of the token which will be used for voting
    /// @param ballotId Id of the voting ballot
    event VersionRequest(
        uint256 requestId,
        RecordsContract.RecordStruct recordData,
        NewVersionTokenStruct governanceToken,
        NewVersionTokenStruct communityToken,
        uint256[] contributionIds,
        address requester,
        uint256 oldVersionId,
        uint256 tokenId,
        uint256 ballotId
    );

    /// @dev This is when a vote is given by user.
    /// @param voter Address of the voter
    /// @param versionRequestId This is the id of the recordVersionRequest structure that is linked to this ballot
    /// @param ballotId Id of the ballot where voting is stored
    /// @param vote State of vote : true for yes and false for No
    event NewVersionVoting(
        address voter,
        uint256 versionRequestId,
        uint256 ballotId,
        bool vote
    );

    /// @dev This is emitted when a voting ballot is created
    /// @param requester Address of the requester
    /// @param versionRequestId This is the id of the recordVersionRequest structure that is linked to this ballot
    /// @param ballotId Id of the ballot where voting is stored
    event NewVersionVotingBallotCreated(
        address requester,
        uint256 versionRequestId,
        uint256 ballotId
    );

    /// @dev this event is generated when result of a ballot is declared
    /// @param versionReqId This is the id of newVersionRequest
    /// @param tokenId This is the id of the token that is linked to this ballot
    /// @param ballotId this is the ballot Id for which result is declared
    /// @param result this is the status of the result
    event NewVersionRequestResult(
        uint256 versionReqId,
        uint256 tokenId,
        uint256 ballotId,
        bool result
    );

    //------------------------------

    ///@param tokenId it is the id of the token on which basis we distribute the reward
    ///@param rewardTokenId it is the id of the new tokenId
    struct NewVersionTokenDistributionStruct {
        uint256 totalSupplyEther;
        uint256 rewardAmountWei;
        uint256 versionRequestId;
        uint256 tokenId;
        uint256 rewardTokenId;
        uint256 rewardPerTokenWei;
        uint256 snapshotId;
    }

    event NewVersionTokenDistribution(
        uint256 versionRequestId,
        uint256 totalSupplyEther,
        uint256 rewardAmountWei,
        uint256 tokenId,
        uint256 rewardTokenId,
        uint256 rewardPerTokenWei,
        uint256 snapshotId
    );

    event NewTokenClaimed(
        uint256 versionRequestId,
        uint256 rewardTokenId,
        uint256 rewardAmount,
        address userAddress
    );

    // newVersionRequestId => tokenData
    mapping(uint256 => NewVersionTokenDistributionStruct) newVersionGovTokenDistributionMapping;

    mapping(uint256 => NewVersionTokenDistributionStruct) newVersionCommTokenDistributionMapping;

    //------------------------------

    constructor(address owner) BaseVotingContract(owner) {}

    /// @dev This is to set the address of the contracts
    /// @param recordsContractAddress New records contract address
    /// @param treasuryContractAddress Takes the address of new treasury contract as parameter
    /// @param treasuryCoreContractAddress Takes the address of new treasury core contract as parameter
    function initialize(
        address recordsContractAddress,
        address treasuryContractAddress,
        address treasuryCoreContractAddress
    ) public initializer _ownerOnly {
        BaseVotingContract.initialize(treasuryContractAddress);
        RECORDS_CONTRACT_ADDRESS = recordsContractAddress;
        TREASURY_CORE_CONTRACT_ADDRESS = treasuryCoreContractAddress;
    }

    /// @dev This struct holds the required data for new version creation
    /// @param name Name of the new record
    /// @param image Cover photo of record
    /// @param recordCategory string category of record
    /// @param oldRecordId old record id
    /// @param contributionIds list of contribution that are part of the new version
    /// @param governanceToken this contains governance token details for new version of record
    /// @param communityToken this contains community token details for new version of record
    struct NewRecordVersionParams {
        string name;
        string image;
        string recordCategory;
        uint256 oldRecordId;
        uint256[] contributionIds;
        NewVersionTokenStruct governanceToken;
        NewVersionTokenStruct communityToken;
    }

    /// @dev This function will create new record version from existing record
    /// @param params required data for creation of new record version
    function createNewRecordVersion(NewRecordVersionParams memory params)
        public
        returns (uint256)
    {
        RecordsContract recordsContract = RecordsContract(
            RECORDS_CONTRACT_ADDRESS
        );

        {
            (, , , , , , , bool isPresent) = recordsContract.recordData(
                params.oldRecordId
            );

            require(isPresent == true, "INVALID: RECORD_NOT_FOUND");
        }
        newVersionRequestId++;
        uint256 versionReqId = newVersionRequestId;

        ITreasury treasury = ITreasury(TREASURY_CONTRACT_ADDRESS);
        uint256 votingTokenId = treasury.getCommunityTokenId(
            params.oldRecordId
        );
        uint256 ballotId = _createVoting(false, votingTokenId);

        treasury.setSymbolsAsUsed(
            params.governanceToken.symbol,
            params.communityToken.symbol
        );

        RecordsContract.RecordStruct memory recordStruct = recordsContract
            .createNewRecordVersion(
                params.oldRecordId,
                params.name,
                params.image,
                params.recordCategory,
                msg.sender,
                ballotId
            );

        NewVersionRequest memory newVersionRequest = NewVersionRequest({
            recordData: recordStruct,
            governanceToken: params.governanceToken,
            communityToken: params.communityToken,
            contributionIds: params.contributionIds,
            requester: msg.sender,
            oldVersionId: params.oldRecordId,
            tokenId: votingTokenId,
            ballotId: ballotId,
            isPresent: true,
            isAccepted: false
        });

        {
            emit VersionRequest({
                requestId: versionReqId,
                recordData: recordStruct,
                governanceToken: params.governanceToken,
                communityToken: params.communityToken,
                contributionIds: params.contributionIds,
                requester: msg.sender,
                oldVersionId: params.oldRecordId,
                tokenId: votingTokenId,
                ballotId: ballotId
            });

            emit NewVersionVotingBallotCreated(
                msg.sender,
                versionReqId,
                ballotId
            );
        }

        newVersionRequestMap[versionReqId] = newVersionRequest;

        return versionReqId;
    }

    /// @dev This function is called by any user to cast vote
    /// @param versionReqId this is the id of the new version request for which user is voting
    /// @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot
    function castVote(uint256 versionReqId, bool vote) public {
        // RecordsContract recordsContract = RecordsContract(
        //     RECORDS_CONTRACT_ADDRESS
        // );
        require(
            newVersionRequestMap[versionReqId].isPresent == true,
            "INVALID: INVALID_VERSION_REQ_ID"
        );

        emit NewVersionVoting({
            versionRequestId: versionReqId,
            ballotId: newVersionRequestMap[versionReqId].ballotId,
            voter: msg.sender,
            vote: vote
        });

        super._castVote(versionReqId, vote);
    }

    /// @dev This function can be called from external source and also from within the contract
    /// @param versionReqId this is the id of the new version request to which the winner is to be declared
    function declareWinner(uint256 versionReqId) external {
        RecordsContract recordsContract = RecordsContract(
            RECORDS_CONTRACT_ADDRESS
        );
        // RecordsContract.NewVersionRequest memory req = recordsContract
        //     .newVersionRequestMap(versionReqId);
        NewVersionRequest memory req = newVersionRequestMap[versionReqId];

        bool result = _declareWinner(req.ballotId);

        emit NewVersionRequestResult({
            versionReqId: versionReqId,
            tokenId: req.tokenId,
            ballotId: req.ballotId,
            result: result
        });

        if (result) {
            ITreasury treasuryContract = ITreasury(TREASURY_CONTRACT_ADDRESS);

            uint256 recordId = recordsContract.createRecordFromData(
                req.recordData,
                req.contributionIds
            );

            // create new version and set the rewards for all the user
            createToken(
                req.governanceToken,
                recordId,
                treasuryContract.getCommunityTokenId(req.oldVersionId),
                versionReqId,
                true,
                req.requester
            );
            createToken(
                req.communityToken,
                recordId,
                treasuryContract.getCommunityTokenId(req.oldVersionId),
                versionReqId,
                false,
                req.requester
            );
        }
        newVersionRequestMap[versionReqId].isAccepted = result;
    }

    /// @dev This function is for distributing of the tokens of new record version
    /// @param versionReqId This is the version Request Id for which token needs to be claimed
    function claimNewRecordTokens(uint256 versionReqId) public {
        NewVersionRequest memory newVersionReq = newVersionRequestMap[
            versionReqId
        ];

        require(
            votingMap[newVersionReq.ballotId].isResultDeclared,
            "INVALID: BALLOT_STILL_OPEN"
        );

        require(
            rewardsClaimed[versionReqId][msg.sender] == false,
            "INVALID: CAN_ONLY_CLAIM_ONCE"
        );

        require(newVersionReq.isAccepted == true, "INVALID: VERSION_REJECTED");

        NewVersionTokenDistributionStruct
            memory governanceToken = newVersionGovTokenDistributionMapping[
                versionReqId
            ];
        NewVersionTokenDistributionStruct
            memory communityToken = newVersionCommTokenDistributionMapping[
                versionReqId
            ];

        uint256 govRewardAmount = calculateRewardTokens(governanceToken);
        uint256 commRewardAmount = calculateRewardTokens(communityToken);

        emit NewTokenClaimed({
            versionRequestId: versionReqId,
            rewardTokenId: governanceToken.rewardTokenId,
            rewardAmount: govRewardAmount,
            userAddress: msg.sender
        });
        emit NewTokenClaimed({
            versionRequestId: versionReqId,
            rewardTokenId: communityToken.rewardTokenId,
            rewardAmount: commRewardAmount,
            userAddress: msg.sender
        });

        alreadyVoted[newVersionReq.ballotId][msg.sender] = true;
    }

    /// @dev This function calculates the amount of token that a user will receive
    /// @param tokenData This is the data of the token which is to be distributed
    function calculateRewardTokens(
        NewVersionTokenDistributionStruct memory tokenData
    ) internal returns (uint256) {
        ITreasuryCore treasuryCoreContract = ITreasuryCore(
            TREASURY_CORE_CONTRACT_ADDRESS
        );

        uint256 tokenBal = treasuryCoreContract.balanceOfAt(
            msg.sender,
            tokenData.snapshotId,
            tokenData.tokenId
        );

        if (tokenBal == 0) {
            return 0;
        }

        uint256 rewardAmt = (tokenData.rewardPerTokenWei * tokenBal) / 1 ether;

        if (rewardAmt > 0) {
            treasuryCoreContract.safeTransferFrom(
                address(this),
                msg.sender,
                tokenData.rewardTokenId,
                rewardAmt,
                "INVALID: ROYALTY_ALREADY_CLAIMED"
            );
        }

        return rewardAmt;
    }

    function createToken(
        NewVersionTokenStruct memory tokenData,
        uint256 newRecordId,
        uint256 decidingTokenId,
        uint256 versionReqId,
        bool isGovernanceToken,
        address requester
    ) internal {
        ITreasury treasuryContract = ITreasury(TREASURY_CONTRACT_ADDRESS);

        uint256 tokenId = decidingTokenId;
        uint256 totalSupply = treasuryContract.totalCirculatingSupply(tokenId);

        uint256 newTokenId;
        if (isGovernanceToken) {
            newTokenId = createGovernanceToken(
                tokenData,
                newRecordId,
                requester
            );
        } else {
            newTokenId = createCommunityToken(
                tokenData,
                newRecordId,
                requester
            );
        }

        NewVersionTokenDistributionStruct
            memory newVersionToken = NewVersionTokenDistributionStruct({
                totalSupplyEther: totalSupply / 1 ether,
                rewardAmountWei: tokenData.oldContributorShare,
                versionRequestId: versionReqId,
                tokenId: tokenId,
                rewardTokenId: newTokenId,
                rewardPerTokenWei: tokenData.oldContributorShare /
                    (totalSupply / 1 ether),
                snapshotId: treasuryContract.snapshot()
            });

        require(
            newVersionToken.rewardPerTokenWei > 0,
            "INSUFFICIENT_AMOUNT: TOKEN_SHARE_PER_USER_IS_LOW"
        );

        emit NewVersionTokenDistribution({
            versionRequestId: versionReqId,
            totalSupplyEther: newVersionToken.totalSupplyEther,
            rewardAmountWei: newVersionToken.rewardAmountWei,
            tokenId: newVersionToken.tokenId,
            rewardTokenId: newTokenId,
            rewardPerTokenWei: newVersionToken.rewardPerTokenWei,
            snapshotId: newVersionToken.snapshotId
        });

        if (isGovernanceToken) {
            newVersionGovTokenDistributionMapping[
                versionReqId
            ] = newVersionToken;
        } else {
            newVersionCommTokenDistributionMapping[
                versionReqId
            ] = newVersionToken;
        }
    }

    function createGovernanceToken(
        NewVersionTokenStruct memory tokenData,
        uint256 recordId,
        address owner
    ) internal returns (uint256) {
        ITreasury treasuryContract = ITreasury(TREASURY_CONTRACT_ADDRESS);

        return
            treasuryContract.createNewGovernanceTokenNewRecordVersion(
                recordId,
                tokenData.totalSupply,
                tokenData.userBalance,
                tokenData.symbol,
                tokenData.image,
                tokenData.oldContributorShare,
                owner
            );
    }

    function createCommunityToken(
        NewVersionTokenStruct memory tokenData,
        uint256 recordId,
        address owner
    ) internal returns (uint256) {
        ITreasury treasuryContract = ITreasury(TREASURY_CONTRACT_ADDRESS);

        return
            treasuryContract.createNewCommunityTokenNewRecordVersion(
                recordId,
                tokenData.totalSupply,
                tokenData.userBalance,
                tokenData.symbol,
                tokenData.image,
                tokenData.oldContributorShare,
                owner
            );
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external virtual override returns (bytes4) {
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
    ) external virtual override returns (bytes4) {
        return
            bytes4(
                keccak256(
                    "onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"
                )
            );
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {}
}
