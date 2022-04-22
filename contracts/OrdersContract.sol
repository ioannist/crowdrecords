pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RecordsContract.sol";
import "./TreasuryContract.sol";

contract OrdersContract {
    address public RECORDS_CONTRACT_ADDRESS;
    address public VOTING_CONTRACT_ADDRESS;
    address public TREASURY_CONTRACT_ADDRESS;
    address OWNER;

    struct Order {
        bool isClosed;
        bool isLocked;
        address seller;
        uint256 creationDate;
        uint256 communityTokenId;
        uint256 communityTokenAmount;
        uint256 communityTokenPrice;
        uint256 governanceTokenId;
        uint256 governanceTokenAmount;
        uint256 governanceTokenPrice;
    }

    /**
        @dev this is event which is created when a user creates order to sell his tokens
        @param saleId this is the Id of the sale order
        @param seller this is the address of the owner or the sale order
        @param isLocked this is denotes wether the user wants to sell the token individually or in a ratio
        @param creationDate this is the creation date of the sale order
        @param communityTokenId this is the community token id that is involved in the sale
        @param communityTokenAmount this is the comunity token amount for sale
        @param communityTokenPrice this is the price of sinle token
        @param governanceTokenId this is the community token id that is involved in the sale
        @param governanceTokenAmount this is the comunity token amount for sale
        @param governanceTokenPrice this is the price of sinle token
     */
    event SaleOrder(
        uint256 saleId,
        address seller,
        bool isLocked,
        uint256 creationDate,
        uint256 communityTokenId,
        uint256 communityTokenAmount,
        uint256 communityTokenPrice,
        uint256 governanceTokenId,
        uint256 governanceTokenAmount,
        uint256 governanceTokenPrice
    );

    /**
        @dev this is event which is created when a user purchases any sale order
        @param saleId this is the Id of the sale order
        @param seller this is the address of the owner or the sale order
        @param buyer this is the address of the person who bought the tokens
        @param creationDate this is the date when tokens were purchased
        @param communityTokenId this is the community token id that is involved in the sale
        @param communityTokenAmount this is the comunity token amount for sale
        @param communityTokenPrice this is the price of sinle token
        @param governanceTokenId this is the community token id that is involved in the sale
        @param governanceTokenAmount this is the comunity token amount for sale
        @param governanceTokenPrice this is the price of sinle token
     */
    event BuySale(
        uint256 saleId,
        address seller,
        address buyer,
        uint256 creationDate,
        uint256 communityTokenId,
        uint256 communityTokenAmount,
        uint256 communityTokenPrice,
        uint256 governanceTokenId,
        uint256 governanceTokenAmount,
        uint256 governanceTokenPrice
    );

    /**
        @dev this event is emmited when user closes his/her sale order
        @param saleId This is the sale Id of the sale order 
        @param creationDate This is the date when the event took place 
     */
    event SaleClose(uint256 saleId, uint256 creationDate);

    mapping(uint256 => Order) orderBook;
    uint256 orderId = 0;

    constructor() {
        OWNER = msg.sender;
    }

    /**
     * @dev Modifier to check that the person who accesses a specific function is the owner of contract himself.
     */
    modifier ownerOnly() {
        require(msg.sender == OWNER, "You are not authorized for this action");
        _;
    }

    /**
     * @dev This function sets the treasury Contract address
     */
    function setTreasuryContractAddress(address newTreasuryContractAddress)
        public
        ownerOnly
    {
        TREASURY_CONTRACT_ADDRESS = newTreasuryContractAddress;
    }

    //safeTransferFrom

    /**
     * @dev This function is called to create a new saleOrder
     */
    function createSaleOrder(
        bool isLocked,
        uint256 communityTokenId,
        uint256 communityTokenAmount,
        uint256 communityTokenPrice,
        uint256 governanceTokenId,
        uint256 governanceTokenAmount,
        uint256 governanceTokenPrice
    ) public returns (uint256 saleOrderId) {
        uint256 newOrderId = orderId;
        orderId++;

        // Any extra validation for the order ratio
        TreasuryContract treasuryContract = TreasuryContract(
            TREASURY_CONTRACT_ADDRESS
        );
        if (communityTokenAmount > 0) {
            treasuryContract.safeTransferFrom(
                msg.sender,
                address(this),
                communityTokenId,
                communityTokenAmount,
                "Sale order"
            );
        }

        if (governanceTokenAmount > 0) {
            treasuryContract.safeTransferFrom(
                msg.sender,
                address(this),
                governanceTokenId,
                governanceTokenAmount,
                "Sale order"
            );
        }

        Order memory order = Order({
            isClosed: false,
            seller: msg.sender,
            isLocked: isLocked,
            creationDate: block.timestamp,
            communityTokenId: communityTokenId,
            communityTokenAmount: communityTokenAmount,
            communityTokenPrice: communityTokenPrice,
            governanceTokenId: governanceTokenId,
            governanceTokenAmount: governanceTokenAmount,
            governanceTokenPrice: governanceTokenPrice
        });

        orderBook[orderId] = order;

        emit SaleOrder({
            saleId: orderId,
            seller: order.seller,
            isLocked: isLocked,
            creationDate: order.creationDate,
            communityTokenId: communityTokenId,
            communityTokenAmount: communityTokenAmount,
            communityTokenPrice: communityTokenPrice,
            governanceTokenId: governanceTokenId,
            governanceTokenAmount: governanceTokenAmount,
            governanceTokenPrice: governanceTokenPrice
        });

        return orderId;
    }

    /**
     * @dev This function is called to cancle the existing sale order
     */
    function cancleSaleOrder(uint256 saleId) public {
        require(
            orderBook[orderId].seller == msg.sender,
            "you are unauthorized for this action"
        );

        require(orderBook[orderId].isClosed == true, "Is already closed");

        Order memory order = orderBook[orderId];

        TreasuryContract treasuryContract = TreasuryContract(
            TREASURY_CONTRACT_ADDRESS
        );
        if (order.communityTokenAmount > 0) {
            treasuryContract.safeTransferFrom(
                msg.sender,
                address(this),
                order.communityTokenId,
                order.communityTokenAmount,
                "Sale order"
            );
        }

        if (order.governanceTokenAmount > 0) {
            treasuryContract.safeTransferFrom(
                msg.sender,
                address(this),
                order.governanceTokenId,
                order.governanceTokenAmount,
                "Sale order"
            );
        }

        orderBook[orderId].isClosed = true;

        emit SaleClose({saleId: saleId, creationDate: block.timestamp});
    }
}
