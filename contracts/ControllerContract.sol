pragma solidity ^0.8.0;

import "./interface/ITracks.sol";
import "./interface/IContribution.sol";
import "./interface/IRecords.sol";
import "./interface/ITreasuryCore.sol";

contract ControllerContract {
    event SetupNewRecordCalled(
        address caller,
        uint[] tracksId,
        uint seedId,
        uint recordId,
        uint govTokenId,
        uint commTokenId
    );

    event CreateNewContributionCalled(
        address caller,
        uint[] tracksId,
        uint contributionId
    );

    ITracks public tracksContract;
    IContribution public contributionsContract;
    IRecords public recordsContract;
    ITreasuryCore private treasuryCoreContract;

    constructor(
        address _tracksContract,
        address _contributionsContract,
        address _recordsContract,
        address _treasuryCoreContract
    ) {
        tracksContract = ITracks(_tracksContract);
        contributionsContract = IContribution(_contributionsContract);
        recordsContract = IRecords(_recordsContract);
        treasuryCoreContract = ITreasuryCore(_treasuryCoreContract);
    }

    /// @notice This function is created to make the record creation flow simpler, this function takes all the required
    /// arguments which are needed to create a new record, that includes the tracks data, contribution data, record data and tokens data
    /// it make serial calls to the other contracts that are individually responsible for creation of tracks,
    /// seed contribution, record and new tokens.
    /// @param tracksPayload Data required to create tracks
    /// @param payload Data required to create seed contributions
    /// @param recordPayload Data required to create record
    /// @param govTokenData Data required to create a governance token
    /// @param commTokenData Data required to create a community token
    /// @param platformWallet this is the UI providers wallet
    /// @param platformFee this is the incentive amount for the UI maintainer
    function setupNewRecord(
        ITracks.TrackPayload[] memory tracksPayload,
        IContribution.SeedContributionPayload memory payload,
        IRecords.NewRecordPayload memory recordPayload,
        ITreasuryCore.NewTokenData memory govTokenData,
        ITreasuryCore.NewTokenData memory commTokenData,
        address payable platformWallet,
        uint256 platformFee
    ) public payable {
        {
            require(msg.value >= platformFee, "INV: INSUFFICIENT_PLATFORM_FEE");
            if (msg.value > 0) {
                platformWallet.call{value: platformFee}("");
            }
        }
        {
            bool isSymbolInUse = treasuryCoreContract.govTokenSym(
                govTokenData.symbol
            );
            require(
                isSymbolInUse == false,
                "INVALID: GOV_TOKEN_SYMBOL_ALREADY_IN_USE"
            );
            require(
                govTokenData.totalSupply >= 1,
                "INVALID: GOV_AT_LEAST_1_TOKEN"
            );
            require(
                govTokenData.totalSupply <= 1 * 10 ** 9 * 1 ether, //The token supply created shouldn't be more than 1 billion
                "INVALID: GOV_SUPPLY_LIMIT_REACHED"
            );

            isSymbolInUse = treasuryCoreContract.commTokenSym(
                commTokenData.symbol
            );
            require(
                isSymbolInUse == false,
                "INVALID: COMM_TOKEN_SYMBOL_ALREADY_IN_USE"
            );
            require(
                commTokenData.totalSupply >= 1,
                "INVALID: COMM_AT_LEAST_1_TOKEN"
            );
            require(
                commTokenData.totalSupply <= 1 * 10 ** 9 * 1 ether, //The token supply created shouldn't be more than 1 billion
                "INVALID: COM_SUPPLY_LIMIT_REACHED"
            );
        }
        uint256[] memory trackIds = tracksContract.controllerCreateNewTracks(
            tracksPayload,
            msg.sender
        );
        payload.tracks = trackIds;
        uint256 contributionId = contributionsContract
            .controllerCreateSeedContribution(payload, msg.sender);
        recordPayload.seedId = contributionId;
        uint256 recordId = recordsContract.controllerCreateNewRecord(
            recordPayload,
            msg.sender
        );
        govTokenData.recordId = recordId;
        uint256 govTokenId = treasuryCoreContract.createNewGovernanceToken(
            govTokenData,
            msg.sender
        );
        commTokenData.recordId = recordId;
        uint256 commTokenId = treasuryCoreContract.createNewCommunityToken(
            commTokenData,
            msg.sender
        );

        {
            emit SetupNewRecordCalled(
                msg.sender,
                trackIds,
                contributionId,
                recordId,
                govTokenId,
                commTokenId
            );
        }
    }

    /// @notice This function is created to make the contribution creation flow simple, it will take the tracks and contribution data as parameter and then call the underlying functions.
    /// @param tracksPayload Data required to create tracks
    /// @param payload Data required to create new contribution
    /// @param platformWallet this is the UI providers wallet
    /// @param platformFee this is the incentive amount for the UI maintainer
    function createNewContribution(
        ITracks.TrackPayload[] memory tracksPayload,
        IContribution.NewContributionPayload memory payload,
        address payable platformWallet,
        uint256 platformFee
    ) public payable {
        {
            require(msg.value >= platformFee, "INV: INSUFFICIENT_PLATFORM_FEE");
            if (msg.value > 0) {
                platformWallet.call{value: platformFee}("");
            }
        }
        uint256[] memory trackIds = tracksContract.createNewTracks(
            tracksPayload
        );
        payload.tracks = trackIds;
        uint256 contributionId = contributionsContract
            .controllerCreateNewContribution{value: msg.value - platformFee}(
            payload,
            msg.sender
        );

        {
            emit CreateNewContributionCalled(
                msg.sender,
                trackIds,
                contributionId
            );
        }
    }
}
