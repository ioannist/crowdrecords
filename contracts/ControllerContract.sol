pragma solidity ^0.8.0;

import "./interface/ITracks.sol";
import "./interface/IContribution.sol";
import "./interface/IRecords.sol";
import "./interface/ITreasuryCore.sol";

contract ControllerContract {
    event setupNewRecordCalled(
        address caller,
        uint[] tracksId,
        uint seedId,
        uint recordId,
        uint govTokenId,
        uint commTokenId
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
            bool isSymbolInUse = treasuryCoreContract.commTokenSym(
                commTokenData.symbol
            );
            require(
                isSymbolInUse == false,
                "INVALID: COMM_TOKEN_SYMBOL_ALREADY_IN_USE"
            );

            isSymbolInUse = treasuryCoreContract.govTokenSym(
                govTokenData.symbol
            );
            require(
                isSymbolInUse == false,
                "INVALID: GOV_TOKEN_SYMBOL_ALREADY_IN_USE"
            );
        }
        uint256[] memory trackIds = tracksContract.createNewTracks(
            tracksPayload
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
            emit setupNewRecordCalled(
                msg.sender,
                trackIds,
                contributionId,
                recordId,
                govTokenId,
                commTokenId
            );
        }
    }
}