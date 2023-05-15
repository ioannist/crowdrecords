pragma solidity ^0.8.0;

import "./interface/ITracks.sol";
import "./interface/IContribution.sol";
import "./interface/IRecords.sol";
import "./interface/ITreasuryCore.sol";

contract ControllerContract {
    //! The token symbol shouldn't be taken when creating token
    // bool isSymbolInUse = treasuryCoreContract.commTokenSym(
    //     newTokenData.symbol
    // );
    // require(isSymbolInUse == false, "INVALID: TOKEN_SYMBOL_ALREADY_IN_USE");

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

    function bundleCalls(
        ITracks.TrackPayload[] memory tracksPayload,
        IContribution.SeedContributionPayload memory payload,
        IRecords.NewRecordPayload memory recordPayload,
        ITreasuryCore.NewTokenData memory govTokenData,
        ITreasuryCore.NewTokenData memory commTokenData,
        address payable platformWallet,
        uint256 platformFee
    ) public payable {
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
        // govTokenData.recordId = recordId;
        // uint256 govTokenId = treasuryCoreContract.createNewGovernanceToken(
        //     govTokenData,
        //     msg.sender
        // );
        // commTokenData.recordId = recordId;
        // uint256 commTokenId = treasuryCoreContract.createNewCommunityToken(
        //     commTokenData,
        //     msg.sender
        // );
        // Emit an event with the created IDs, if necessary
    }
}
