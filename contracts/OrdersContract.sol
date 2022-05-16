pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./RecordsContract.sol";
import "./TreasuryContract.sol";

contract OrdersContract {
    address public RECORDS_CONTRACT_ADDRESS;
    address public VOTING_CONTRACT_ADDRESS;
    address public TREASURY_CONTRACT_ADDRESS;
    uint8 TRANSACTION_FEE = 50; //This is 0.50%
    address OWNER;

    struct Order {
        bool isClosed;
        bool isLockedInRatio;
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
        @param isLockedInRatio the is denotes wether the user wants to sell the token individually or in a ratio
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
        bool isLockedInRatio,
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
    event SaleBought(
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
        bool isLockedInRatio,
        uint256 recordId,
        uint256 communityTokenId,
        uint256 communityTokenAmount,
        uint256 communityTokenPrice,
        uint256 governanceTokenId,
        uint256 governanceTokenAmount,
        uint256 governanceTokenPrice
    ) public returns (uint256 saleOrderId) {
        TreasuryContract treasuryContract = TreasuryContract(
            TREASURY_CONTRACT_ADDRESS
        );

        require(
            treasuryContract.getCommunityTokenId(recordId) == communityTokenId,
            "Invalid community token id"
        );
        require(
            treasuryContract.getGovernanceTokenId(recordId) ==
                governanceTokenId,
            "Invalid governance token id"
        );

        if (isLockedInRatio) {
            require(
                communityTokenAmount > 0,
                "You cannot have 0 community token amount"
            );

            require(
                governanceTokenAmount > 0,
                "You cannot have 0 governance token amount"
            );
        }

        uint256 newOrderId = orderId;
        orderId++;

        //need to have allowance of the seller's token with ordersContract acting as a spender
        if (communityTokenAmount > 0) {
            treasuryContract.safeTransferFrom(
                tx.origin,
                address(this),
                communityTokenId,
                communityTokenAmount,
                "Sale order"
            );
        }

        if (governanceTokenAmount > 0) {
            treasuryContract.safeTransferFrom(
                tx.origin,
                address(this),
                governanceTokenId,
                governanceTokenAmount,
                "Sale order"
            );
        }

        Order memory order = Order({
            isClosed: false,
            seller: tx.origin,
            isLockedInRatio: isLockedInRatio,
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
            isLockedInRatio: isLockedInRatio,
            creationDate: order.creationDate,
            communityTokenId: communityTokenId,
            communityTokenAmount: communityTokenAmount,
            communityTokenPrice: communityTokenPrice,
            governanceTokenId: governanceTokenId,
            governanceTokenAmount: governanceTokenAmount,
            governanceTokenPrice: governanceTokenPrice
        });

        return newOrderId;
    }

    /**
     * @dev This function is called to cancle the existing sale order
     */
    function cancelSaleOrder(uint256 saleId) public {
        require(
            orderBook[orderId].seller == msg.sender,
            "you are unauthorized for this action"
        );

        require(orderBook[orderId].isClosed == false, "Is already closed");

        Order memory order = orderBook[orderId];

        TreasuryContract treasuryContract = TreasuryContract(
            TREASURY_CONTRACT_ADDRESS
        );
        //--- Need to have additional checks for balance of the sale and also to deduct the tokens from the sale struct
        if (order.communityTokenAmount > 0) {
            treasuryContract.safeTransferFrom(
                address(this),
                order.seller,
                order.communityTokenId,
                order.communityTokenAmount,
                "Sale order"
            );
        }

        if (order.governanceTokenAmount > 0) {
            treasuryContract.safeTransferFrom(
                address(this),
                order.seller,
                order.governanceTokenId,
                order.governanceTokenAmount,
                "Sale order"
            );
        }

        orderBook[orderId].isClosed = true;

        emit SaleClose({saleId: saleId, creationDate: block.timestamp});
    }

    /**
     * @dev This function is called to cancle the existing sale order
     */
    function purchaseSaleOrder(
        uint256 saleId,
        uint256 governanceTokenAmount,
        uint256 communityTokenAmount
    ) public {
        require(
            orderBook[orderId].seller != msg.sender,
            "you cannot purchase your own tokens"
        );

        require(orderBook[orderId].isClosed == false, "Is already closed");

        Order memory order = orderBook[orderId];

        //This will check if the amount to purchase is less or equal than the order that is generated
        require(
            order.communityTokenAmount >= communityTokenAmount,
            "Community token amount is insufficent"
        );
        require(
            order.governanceTokenAmount >= governanceTokenAmount,
            "Governance token amount is insufficent"
        );

        if (order.isLockedInRatio) {
            //Multiply bigger value to make sure that we have proper ratio.
            //As if we don't do that then something like 3/2 and 5/4 will be considers same and they will result in a false positive
            if (order.communityTokenAmount > order.governanceTokenAmount) {
                require(
                    SafeMath.div(
                        communityTokenAmount * 100,
                        governanceTokenAmount,
                        "Invalid ratio"
                    ) ==
                        SafeMath.div(
                            order.communityTokenAmount * 100,
                            order.governanceTokenAmount,
                            "Invalid ratio"
                        ),
                    "Invalid Ratio"
                );
            } else {
                require(
                    SafeMath.div(
                        governanceTokenAmount * 100,
                        communityTokenAmount,
                        "Invalid ratio"
                    ) ==
                        SafeMath.div(
                            order.governanceTokenAmount * 100,
                            order.communityTokenAmount,
                            "Invalid ratio"
                        ),
                    "Invalid Ratio"
                );
            }
        }

        if (order.communityTokenAmount > 0) {
            _transferTokensAndTransactionCharge(
                communityTokenAmount,
                order.communityTokenPrice,
                order.communityTokenId
            );
        }

        if (order.governanceTokenAmount > 0) {
            _transferTokensAndTransactionCharge(
                governanceTokenAmount,
                order.governanceTokenPrice,
                order.governanceTokenId
            );
        }

        emit SaleBought({
            saleId: saleId,
            seller: order.seller,
            buyer: msg.sender,
            creationDate: block.timestamp,
            communityTokenId: order.communityTokenId,
            communityTokenAmount: communityTokenAmount,
            communityTokenPrice: order.communityTokenPrice,
            governanceTokenId: order.governanceTokenId,
            governanceTokenAmount: governanceTokenAmount,
            governanceTokenPrice: order.governanceTokenPrice
        });

        order.communityTokenAmount =
            order.communityTokenAmount -
            communityTokenAmount;

        order.governanceTokenAmount =
            order.governanceTokenAmount -
            governanceTokenAmount;

        if (
            order.communityTokenAmount == 0 && order.governanceTokenAmount == 0
        ) {
            order.isClosed = true;
            emit SaleClose({saleId: saleId, creationDate: block.timestamp});
        }
        orderBook[orderId] = order;
    }

    /// @notice This is only for internal use
    /// @dev This function is responsible to transfer the tokens at the time of purchase and it is also responsible for transfering the fees.
    /// @param tokenAmount This is the amount of token to transfer
    /// @param tokenPrice This is the token price at which the tokens are being sold at
    /// @param tokenId this is the ID of the token to transfer
    function _transferTokensAndTransactionCharge(
        uint256 tokenAmount,
        uint256 tokenPrice,
        uint256 tokenId
    ) internal {
        uint256 transactionAmount = (tokenAmount * tokenPrice);
        uint256 transactionFee = (transactionAmount * TRANSACTION_FEE) / 1000;

        TreasuryContract treasuryContract = TreasuryContract(
            TREASURY_CONTRACT_ADDRESS
        );
        treasuryContract.safeTransferFrom(
            msg.sender,
            address(this),
            treasuryContract.CRD(),
            transactionFee,
            "Sale transaction fee"
        );

        treasuryContract.safeTransferFrom(
            msg.sender,
            address(this),
            treasuryContract.CRD(),
            transactionAmount,
            "Sale token price amount transfer to seller"
        );

        treasuryContract.safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            tokenAmount,
            "Sale token transfer to buyer"
        );
    }

    /**
    Below code are for transfer of tokens from ERC1155 standard contract
     */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
