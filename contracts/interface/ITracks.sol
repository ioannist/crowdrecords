pragma solidity ^0.8.0;

interface ITracks {
    function checkOwner(uint256[] memory tracks, address owner)
        external
        view
        returns (bool);
}
