pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "./interface/IContribution.sol";
import "./Voting/BaseVotingContract.sol";
import "./interface/ITreasury.sol";
import "./interface/ITreasuryCore.sol";

contract RecordsContract is BaseVotingContract, IERC1155Receiver {
    uint256 newTokenId = 0;
    uint256 newVersionRequestId = 0;

    // This mapping contains data of record
    mapping(uint256 => RecordStruct) public recordData;
    // This mapping contains if seed data id is being used or not
    // Same shouldn't be used to create 2 different records, unless the other record is a different
    // version of existing record
    mapping(uint256 => bool) public seedIdUsed;

    //This is mapping that holds the listing of versions that are created from a original record
    mapping(uint256 => uint256[]) public recordVersion;

    // This mapping will hold the list of contributions that are linked to a specific record
    mapping(uint256 => uint256[]) public recordContributions;

    // This mapping holds the data of new record version requests
    mapping(uint256 => NewVersionRequest) public newVersionRequestMap;

    // Address of the contribution contracts
    address public CONTRIBUTION_CONTRACT_ADDRESS;

    // Address of the treasury core contracts
    address public TREASURY_CORE_CONTRACT_ADDRESS;

    /// @dev This struct holds the data for record token
    /// @param name Name of the record
    /// @param image This is the image of the record
    /// @param seedId This is the seed contribution id
    /// @param parentId This is the id of the parent record from which record is created
    /// @param owner Address of the owner
    /// @param recordCategory This is the record category
    /// @param creationDate This is the creation date of the record
    struct RecordStruct {
        string name;
        string image;
        uint256 seedId;
        uint256 parentId;
        address owner;
        string recordCategory;
        uint256 creationDate;
        bool isPresent;
    }

    /// @dev This struct holds the data for records that are accepted
    /// @param recordId Name of the record
    /// @param governanceTokenId This is the image of the record
    /// @param communityTokenId This is the seed contribution id
    struct AcceptedRecordStruct {
        uint256 recordId;
        uint256 governanceTokenId;
        uint256 communityTokenId;
        bool isPresent;
    }

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
        RecordStruct recordData;
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

    /// @dev This event is emited when new record is created
    /// @param recordId This is the recordId
    /// @param name Name of the record
    /// @param image This is the image of the record
    /// @param seedId This is the seed contribution id
    /// @param parentId This is the id of the parent record from which record is created
    /// @param recordCategory This is the record category
    /// @param creationDate This is the creation date of the record
    event RecordCreated(
        uint256 recordId,
        string name,
        string image,
        uint256 seedId,
        uint256 parentId,
        string recordCategory,
        uint256 creationDate
    );

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
        RecordStruct recordData,
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

    /// @dev Modifier to check that the function is only being called from the contribution contract
    modifier onlyContributionContract() {
        require(
            msg.sender == CONTRIBUTION_CONTRACT_ADDRESS,
            "UNAUTHORIZED: ONLY_CONTRIBUTION_CONTRACT"
        );
        _;
    }

    /// @dev This function sets the contribution Contract address
    /// @param contributionContractAddress Takes the address of new contribution contract as parameter
    function setContributionContractAddress(address contributionContractAddress)
        public
        _ownerOnly
    {
        CONTRIBUTION_CONTRACT_ADDRESS = contributionContractAddress;
    }

    /// @dev This function sets the Treasury Contract address
    /// @param treasuryContractAddress Takes the address of new treasury contract as parameter
    function setTreasuryContractAddress(address treasuryContractAddress)
        public
        _ownerOnly
    {
        _setTreasuryContractAddress(treasuryContractAddress);
    }

    /// @dev This function sets the Treasury Contract address
    /// @param treasuryCoreContractAddress Takes the address of new treasury core contract as parameter
    function setTreasuryCoreContractAddress(address treasuryCoreContractAddress)
        public
        _ownerOnly
    {
        TREASURY_CORE_CONTRACT_ADDRESS = treasuryCoreContractAddress;
    }

    /// @dev This function creates new record
    /// @param name This is the name of the record
    /// @param image This is the image/logo of the record
    /// @param recordCategory This is the category to which record belongs
    /// @param seedId This is the seed contribution id
    function createNewRecord(
        string memory name,
        string memory image,
        string memory recordCategory,
        uint256 seedId
    ) public returns (uint256 recordId) {
        newTokenId++;
        uint256 recordId = newTokenId;

        require(seedIdUsed[seedId] == false, "INVALID: SEED_ALREADY_USED");

        IContribution contributionContract = IContribution(
            CONTRIBUTION_CONTRACT_ADDRESS
        );

        IContribution.Contribution memory contribution = contributionContract
            .getContributionData(seedId);

        require(
            contribution.isPresent == true,
            "INVALID: CONTRIBUTION_NOT_FOUND"
        );

        require(
            contribution.seedContribution == true,
            "INVALID: NOT_SEED_CONTRIBUTION"
        );

        RecordStruct memory recordStruct = RecordStruct({
            name: name,
            image: image,
            seedId: seedId,
            parentId: 0,
            owner: msg.sender,
            recordCategory: recordCategory,
            creationDate: block.timestamp,
            isPresent: true
        });

        recordData[recordId] = recordStruct;
        recordContributions[recordId].push(seedId);

        emit RecordCreated({
            recordId: recordId,
            name: name,
            image: image,
            seedId: seedId,
            parentId: 0,
            recordCategory: recordCategory,
            creationDate: recordStruct.creationDate
        });

        return (recordId);
    }

    /// @dev This function pushes a contribution into the array of the record
    /// @param recordId This is the recordId to which contribution is to be added
    /// @param contributionId This is the contribution id to push in array
    function pushContributionIdToContributionList(
        uint256 recordId,
        uint256 contributionId
    ) external onlyContributionContract {
        recordContributions[recordId].push(contributionId);
    }

    /// @dev This function return the address of record owner
    /// @param recordId This is the recordId whose owner you want
    function ownerOf(uint256 recordId) external returns (address) {
        return recordData[recordId].owner;
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
        newTokenId++;
        uint256 recordId = newTokenId;
        newVersionRequestId++;
        uint256 versionReqId = newVersionRequestId;

        require(
            recordData[params.oldRecordId].isPresent == true,
            "INVALID: RECORD_NOT_FOUND"
        );

        RecordStruct memory sourceVersion = recordData[params.oldRecordId];
        RecordStruct memory recordStruct = RecordStruct({
            name: params.name,
            image: params.image,
            seedId: sourceVersion.seedId,
            parentId: params.oldRecordId,
            owner: msg.sender,
            recordCategory: params.recordCategory,
            creationDate: block.timestamp,
            isPresent: true
        });

        // create new version,
        // take existing records id,
        // The seed will stay same
        // The contributions id is selected by user,
        // push contribution ids
        // push version id
        // create voting for the token distribution,
        // book both of the token symbol treasury
        // wait for result - generate tokens

        ITreasury treasury = ITreasury(TREASURY_CONTRACT_ADDRESS);
        treasury.setSymbolsAsUsed(
            params.governanceToken.symbol,
            params.communityToken.symbol
        );

        uint256 ballotId = _createVoting(
            false,
            treasury.getCommunityTokenId(params.oldRecordId)
        );
        NewVersionRequest memory newVersionRequest = NewVersionRequest({
            recordData: recordStruct,
            governanceToken: params.governanceToken,
            communityToken: params.communityToken,
            contributionIds: params.contributionIds,
            requester: msg.sender,
            oldVersionId: params.oldRecordId,
            tokenId: treasury.getCommunityTokenId(params.oldRecordId),
            ballotId: ballotId,
            isPresent: true,
            isAccepted: false
        });

        emit VersionRequest(
            versionReqId,
            recordStruct,
            params.governanceToken,
            params.communityToken,
            params.contributionIds,
            msg.sender,
            params.oldRecordId,
            newVersionRequest.ballotId,
            newVersionRequest.oldVersionId
        );

        emit NewVersionVotingBallotCreated(msg.sender, versionReqId, ballotId);

        newVersionRequestMap[versionReqId] = newVersionRequest;

        return (recordId);
    }

    /// @dev This function is called by any user to cast vote
    /// @param versionReqId this is the id of the new version request for which user is voting
    /// @param vote this is the state of the vote, if true than it means the vote is in favour of the ballot
    function castVote(uint256 versionReqId, bool vote) public {
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
        NewVersionRequest memory req = newVersionRequestMap[versionReqId];
        bool result = _declareWinner(req.ballotId);

        emit NewVersionRequestResult({
            versionReqId: versionReqId,
            tokenId: req.tokenId,
            ballotId: req.ballotId,
            result: result
        });

        if (result) {
            newTokenId++;
            uint256 recordId = newTokenId;
            ITreasury treasuryContract = ITreasury(TREASURY_CONTRACT_ADDRESS);
            recordData[recordId] = req.recordData;
            recordContributions[recordId] = req.contributionIds;
            recordContributions[recordId].push(req.recordData.seedId);
            recordVersion[req.oldVersionId].push(recordId);
            emit RecordCreated({
                recordId: recordId,
                name: req.recordData.name,
                image: req.recordData.image,
                seedId: req.recordData.seedId,
                parentId: req.recordData.parentId,
                recordCategory: req.recordData.recordCategory,
                creationDate: req.recordData.creationDate
            });
            // create new version and set the rewards for all the user
            newVersionRequestMap[versionReqId].isAccepted = true;
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
        } else {
            ITreasury treasury = ITreasury(TREASURY_CONTRACT_ADDRESS);
            treasury.setSymbolsAsAvailable(
                req.governanceToken.symbol,
                req.communityToken.symbol
            );
            newVersionRequestMap[versionReqId].isAccepted = false;
        }
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
            alreadyVoted[newVersionReq.ballotId][msg.sender] == false,
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

        newVersionGovTokenDistributionMapping[versionReqId] = newVersionToken;
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
