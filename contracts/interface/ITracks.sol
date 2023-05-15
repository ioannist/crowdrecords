pragma solidity ^0.8.0;

interface ITracks {
    struct TrackPayload {
        string filehash;
        string filelink;
        string category;
    }

    function checkOwner(
        uint256[] memory tracks,
        address owner
    ) external view returns (bool);

    function createNewTracks(
        TrackPayload[] memory tracksPayload
    ) external returns (uint256[] memory);
}
