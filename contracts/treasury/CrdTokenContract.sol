pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CrdTokenContract is ERC20, Initializable {
    address public TREASURY_CONTRACT_ADDRESS;
    address public TREASURY_CORE_CONTRACT_ADDRESS;
    address public AGREEMENTS_CONTRACT_ADDRESS;
    address public OWNER;

    // By default URI to crowdrecords domain
    // 18 decimal points supported
    constructor(address owner) ERC20("Crowdrecords", "CRD") {
        OWNER = owner;
        _mint(owner, 1000000 * 10**18);
    }

    /// @dev Modifier to check that the person who accesses a specific function is the owner of contract himself.
    modifier ownerOnly() {
        require(msg.sender == OWNER, "UNAUTHORIZED: CANNOT_PERFORM_ACTION");
        _;
    }

    /// @dev Modifier to check that the function is called by crowdrecords tokens only
    modifier contractsOnly() {
        require(
            msg.sender == TREASURY_CORE_CONTRACT_ADDRESS ||
                msg.sender == TREASURY_CONTRACT_ADDRESS ||
                msg.sender == AGREEMENTS_CONTRACT_ADDRESS,
            "UNAUTHORIZED: CANNOT_PERFORM_ACTION"
        );
        _;
    }

    /// @dev This is to set the address of the contracts
    /// @param newTreasuryCoreAddress This is the address of new treasury core contract
    /// @param newTreasuryAddress This is the address of new treasury contract
    /// @param newAgreementsAddress This is the address of new Agreement contract
    function initialize(
        address newTreasuryCoreAddress,
        address newTreasuryAddress,
        address newAgreementsAddress
    ) public initializer ownerOnly {
        TREASURY_CORE_CONTRACT_ADDRESS = newTreasuryCoreAddress;
        TREASURY_CONTRACT_ADDRESS = newTreasuryAddress;
        AGREEMENTS_CONTRACT_ADDRESS = newAgreementsAddress;
    }

    /// @dev This function is for internal usage, this function will check for the allowance and
    /// and then it will approve the max uint amount as a spender
    /// @param owner owner's address
    /// @param spender spenders address
    function _checkAndApproveAllowance(address owner, address spender)
        internal
    {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance == 0) {
            _approve(
                owner,
                spender,
                0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
            );
        }
    }

    /// @notice This function is only for crowdrecords contracts
    /// This function is called from agreements contracts for paying and claiming the royalty,
    /// and from orders contract for transfer of CRD tokens for purchase or sale of community or governance tokens
    /// and from treasury core contract when someone wants to transfer their tokens to other accounts
    /// @dev This function will be only called from crowdrecords contracts, it will check for the
    /// allowance and approve tokens on behalf of user so that necessary operations can be performed
    /// @param to receiver's address
    /// @param amount number of tokens to be transferred
    function safeTransferFrom(
        address from,
        address to,
        uint256 amount
    ) public contractsOnly {
        _checkAndApproveAllowance(from, msg.sender);
        _transfer(from, to, amount);
    }
}
