// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1155/SnapshotERC1155.sol";

contract ERC1155SnapshotMock is SnapshotERC1155 {
    uint256 private LastTokenId = 1;

    constructor(
        string memory url,
        address initialAccount,
        uint256 initialBalance
    ) ERC1155(url) {
        _mint(initialAccount, LastTokenId, initialBalance, "Dummy Url");
        LastTokenId += 1;
    }

    function snapshot() public {
        _snapshot();
    }

    function mint(address account, uint256 tokenId, uint256 amount) public {
        if (tokenId >= LastTokenId) {
            revert("Invalid token");
        }
        _mint(account, tokenId, amount, "Dummy Url");
    }

    function createNewToken(address account, uint256 amount) public {
        _mint(account, LastTokenId, amount, "Dummy Url");
        LastTokenId += 1;
    }

    function burn(address account, uint256 tokenId, uint256 amount) public {
        _burn(account, tokenId, amount);
    }
}
