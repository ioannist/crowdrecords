pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interface/ITreasuryCore.sol";
import "./interface/ITreasury.sol";

contract OrdersContract {
    address public VOTING_CONTRACT_ADDRESS;
    address public TREASURY_CONTRACT_ADDRESS;
    address public TREASURY_CORE_CONTRACT_ADDRESS;
    address public WALLET_ADDRESS;
    uint8 TRANSACTION_FEE = 50; //This is 0.50%
    address public OWNER;

    /// @dev this is event which is created when a user creates order to sell his tokens
    /// @param isClosed this is if a order is closed or not, that is if any amount is remaining for purchase or not,
    /// it will also be false if order was canceled by user
    /// @param isLockedInRatio the is denotes wether the user wants to sell the token individually or in a ratio
    /// @param buyer this is the address of the owner or the Buy order
    /// @param creationDate this is the creation date of the Buy order
    /// @param communityTokenId this is the community token id that is involved in the Buy order
    /// @param communityTokenAmount this is the community token amount for Buy order
    /// @param communityTokenPrice this is the price of single token
    /// @param governanceTokenId this is the community token id that is involved in the Buy order
    /// @param governanceTokenAmount this is the community token amount for Buy order
    /// @param governanceTokenPrice this is the price of single token
    /// @param crdBalance this is the total balance remaining for the order
    struct Order {
        bool isClosed;
        bool isLockedInRatio;
        address buyer;
        uint256 creationDate;
        uint256 communityTokenId;
        uint256 communityTokenAmount;
        uint256 communityTokenPrice;
        uint256 governanceTokenId;
        uint256 governanceTokenAmount;
        uint256 governanceTokenPrice;
        uint256 crdBalance;
    }

    /// @dev this is event which is created when a user creates order to sell his tokens
    /// @param saleId this is the Id of the Buy order
    /// @param buyer this is the address of the owner or the Buy order
    /// @param isLockedInRatio the is denotes wether the user wants to sell the token individually or in a ratio
    /// @param creationDate this is the creation date of the Buy order
    /// @param communityTokenId this is the community token id that is involved in the Buy order
    /// @param communityTokenAmount this is the community token amount for Buy order
    /// @param communityTokenPrice this is the price of single token
    /// @param governanceTokenId this is the community token id that is involved in the Buy order
    /// @param governanceTokenAmount this is the community token amount for Buy order
    /// @param governanceTokenPrice this is the price of single token
    /// @param crdBalance this is the total balance remaining for the order
    event BuyOrder(
        uint256 saleId,
        address buyer,
        bool isLockedInRatio,
        uint256 creationDate,
        uint256 communityTokenId,
        uint256 communityTokenAmount,
        uint256 communityTokenPrice,
        uint256 governanceTokenId,
        uint256 governanceTokenAmount,
        uint256 governanceTokenPrice,
        uint256 crdBalance
    );

    /// @dev this is event which is created when a user purchases any sale order
    /// @param saleId this is the Id of the sale order
    /// @param seller this is the address of the person who sold the tokens in exchange for the crd
    /// @param buyer this is the address of the owner or the sale order
    /// @param creationDate this is the date when tokens were purchased
    /// @param communityTokenId this is the community token id that is involved in the sale
    /// @param communityTokenAmount this is the community token amount for sale
    /// @param communityTokenPrice this is the price of single token
    /// @param governanceTokenId this is the community token id that is involved in the sale
    /// @param governanceTokenAmount this is the community token amount for sale
    /// @param governanceTokenPrice this is the price of single token
    /// @param amountTransferred this is the total amount paid
    /// @param platformFees this is the platform fees taken by crowdrecords

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
        uint256 governanceTokenPrice,
        uint256 amountTransferred,
        uint256 platformFees
    );

    /// @dev this event is emmited when user closes his/her sale order
    /// @param saleId This is the sale Id of the sale order
    /// @param creationDate This is the date when the event took place
    /// @param remainingBalance This is the amount that was remaining from the partially fulfilled orders
    event OrderClose(
        uint256 saleId,
        uint256 creationDate,
        uint256 remainingBalance
    );

    mapping(uint256 => Order) public orderBook;
    uint256 orderId = 0;

    constructor(address owner) {
        OWNER = owner;
    }

    /// @dev Modifier to check that the person who accesses a specific function is the owner of contract himself.
    modifier ownerOnly() {
        require(msg.sender == OWNER, "UNAUTHORIZED: CANNOT_PERFORM_ACTION");
        _;
    }

    /// @notice This function is to set the owner address
    /// @dev This function takes in the address of new owner and sets it to the contract
    /// @param owner Takes the address of new owner as parameter
    function setOwnerAddress(address owner) public ownerOnly {
        OWNER = owner;
    }

    /// @dev This function sets the treasury Contract address
    /// @param newTreasuryContractAddress the is the new treasuryContractAddress
    function setTreasuryContractAddress(address newTreasuryContractAddress)
        public
        ownerOnly
    {
        TREASURY_CONTRACT_ADDRESS = newTreasuryContractAddress;
    }

    /// @dev This function sets the wallet address this address will receive all the transaction royalties
    /// @param newWalletAddress the is the new newWalletAddress
    function setWalletAddress(address newWalletAddress) public ownerOnly {
        WALLET_ADDRESS = newWalletAddress;
    }

    /// @dev This function is called to create a new saleOrder
    /// @param isLockedInRatio the is denotes wether the user wants to sell the token individually or in a ratio
    /// @param communityTokenId this is the community token id that is involved in the Buy order
    /// @param communityTokenAmount this is the community token amount for Buy order
    /// @param communityTokenPrice this is the price of single token
    /// @param governanceTokenId this is the community token id that is involved in the Buy order
    /// @param governanceTokenAmount this is the community token amount for Buy order
    /// @param governanceTokenPrice this is the price of single token
    function createBuyOrder(
        bool isLockedInRatio,
        uint256 recordId,
        uint256 communityTokenId,
        uint256 communityTokenAmount,
        uint256 communityTokenPrice,
        uint256 governanceTokenId,
        uint256 governanceTokenAmount,
        uint256 governanceTokenPrice
    ) public returns (uint256 saleOrderId) {
        ITreasury treasuryContract = ITreasury(TREASURY_CONTRACT_ADDRESS);

        require(
            treasuryContract.getCommunityTokenId(recordId) == communityTokenId,
            "INVALID: COMMUNITY_TOKEN_ID"
        );
        require(
            treasuryContract.getGovernanceTokenId(recordId) ==
                governanceTokenId,
            "INVALID: GOVERNANCE_TOKEN_ID"
        );

        if (isLockedInRatio) {
            require(
                communityTokenAmount > 0,
                "INVALID: CANNOT_HAVE_0_COMMUNITY_AMOUNT"
            );

            require(
                governanceTokenAmount > 0,
                "INVALID: CANNOT_HAVE_0_GOVERNANCE_AMOUNT"
            );
        }

        //Calculate the total CRD required for the deal and then transfer them
        uint256[2] memory tokenTotal;
        tokenTotal[0] = governanceTokenAmount * governanceTokenPrice;
        tokenTotal[1] = communityTokenAmount * communityTokenPrice;

        //Transferring the CRD token into contract to lock it
        treasuryContract.safeTransferFrom(
            tx.origin,
            address(this),
            treasuryContract.CRD(),
            tokenTotal[1] + tokenTotal[0],
            "Sale order"
        );

        uint256 newOrderId = orderId;
        orderId++;

        Order memory order = Order({
            isClosed: false,
            buyer: tx.origin,
            isLockedInRatio: isLockedInRatio,
            creationDate: block.timestamp,
            communityTokenId: communityTokenId,
            communityTokenAmount: communityTokenAmount,
            communityTokenPrice: communityTokenPrice,
            governanceTokenId: governanceTokenId,
            governanceTokenAmount: governanceTokenAmount,
            governanceTokenPrice: governanceTokenPrice,
            crdBalance: tokenTotal[0] + tokenTotal[1]
        });

        orderBook[orderId] = order;

        emit BuyOrder({
            saleId: orderId,
            buyer: order.buyer,
            isLockedInRatio: isLockedInRatio,
            creationDate: order.creationDate,
            communityTokenId: communityTokenId,
            communityTokenAmount: communityTokenAmount,
            communityTokenPrice: communityTokenPrice,
            governanceTokenId: governanceTokenId,
            governanceTokenAmount: governanceTokenAmount,
            governanceTokenPrice: governanceTokenPrice,
            crdBalance: tokenTotal[0] + tokenTotal[1]
        });

        return newOrderId;
    }

    /// @dev This function is called to cancel the existing sale order
    /// @param saleId This is the id of the buy order to cancel
    function cancelBuyOrder(uint256 saleId) public {
        require(
            orderBook[saleId].buyer == msg.sender,
            "UNAUTHORIZED: ONLY_ORDER_CREATOR"
        );

        require(orderBook[saleId].isClosed == false, "INVALID: ORDER_CLOSED");

        Order memory order = orderBook[saleId];

        ITreasuryCore treasuryCoreContract = ITreasuryCore(
            TREASURY_CORE_CONTRACT_ADDRESS
        );

        //--- Need to have additional checks for balance of the sale and also to deduct the tokens from the sale struct
        //Send back the remaining amount to user
        treasuryCoreContract.safeTransferFrom(
            address(this),
            order.buyer,
            treasuryCoreContract.CRD(),
            order.crdBalance,
            "Sale order canceled"
        );

        orderBook[saleId].isClosed = true;

        emit OrderClose({
            saleId: saleId,
            creationDate: block.timestamp,
            remainingBalance: order.crdBalance
        });
    }

    event DEBUG(
        uint256 amount,
        uint256 fees,
        uint256 totalCRD,
        uint256 otherTest
    );

    /// @dev This function is called to accept the existing buy order
    /// @param saleId This is the id of the buy order to buy
    /// @param governanceTokenAmount This is the governance token amount that is being offered
    /// @param communityTokenAmount This is the community token amount that is being offered
    function acceptBuyOrder(
        uint256 saleId,
        uint256 governanceTokenAmount,
        uint256 communityTokenAmount
    ) public {
        require(
            orderBook[saleId].buyer != msg.sender,
            "INVALID: CANNOT_PURCHASE_SELF_ORDER"
        );

        require(orderBook[saleId].isClosed == false, "INVALID: ORDER_CLOSED");

        Order storage order = orderBook[saleId];

        //This will check if the amount to purchase is less or equal than the order that is generated
        require(
            order.communityTokenAmount >= communityTokenAmount,
            "INSUFFICIENT: COMMUNITY_TOKEN_AMOUNT"
        );
        require(
            order.governanceTokenAmount >= governanceTokenAmount,
            "INSUFFICIENT: GOVERNANCE_TOKEN_AMOUNT"
        );

        if (order.isLockedInRatio) {
            //Multiply bigger value to make sure that we have proper ratio.
            //As if we don't do that then something like 3/2 and 5/4 will be considers same and they will result in a false positive
            if (order.communityTokenAmount > order.governanceTokenAmount) {
                require(
                    SafeMath.div(
                        communityTokenAmount * 100,
                        governanceTokenAmount,
                        "INVALID: TOKEN_RATIO"
                    ) ==
                        SafeMath.div(
                            order.communityTokenAmount * 100,
                            order.governanceTokenAmount,
                            "INVALID: TOKEN_RATIO"
                        ),
                    "INVALID: TOKEN_RATIO"
                );
            } else {
                require(
                    SafeMath.div(
                        governanceTokenAmount * 100,
                        communityTokenAmount,
                        "INVALID: TOKEN_RATIO"
                    ) ==
                        SafeMath.div(
                            order.governanceTokenAmount * 100,
                            order.communityTokenAmount,
                            "INVALID: TOKEN_RATIO"
                        ),
                    "INVALID: TOKEN_RATIO"
                );
            }
        }

        uint256 amount = 0;
        uint256 fees = 0;
        if (order.communityTokenAmount > 0) {
            (
                uint256 cost,
                uint256 platformFees
            ) = _transferTokensAndTransactionCharge(
                    communityTokenAmount,
                    order.communityTokenPrice,
                    order.communityTokenId,
                    order.buyer
                );
            amount = amount + cost;
            fees = fees + platformFees;
        }

        if (order.governanceTokenAmount > 0) {
            (
                uint256 cost,
                uint256 platformFees
            ) = _transferTokensAndTransactionCharge(
                    governanceTokenAmount,
                    order.governanceTokenPrice,
                    order.governanceTokenId,
                    order.buyer
                );
            amount = amount + cost;
            fees = fees + platformFees;
        }

        emit SaleBought({
            saleId: saleId,
            seller: order.buyer,
            buyer: msg.sender,
            creationDate: block.timestamp,
            communityTokenId: order.communityTokenId,
            communityTokenAmount: communityTokenAmount,
            communityTokenPrice: order.communityTokenPrice,
            governanceTokenId: order.governanceTokenId,
            governanceTokenAmount: governanceTokenAmount,
            governanceTokenPrice: order.governanceTokenPrice,
            amountTransferred: amount + fees,
            platformFees: fees
        });

        order.communityTokenAmount =
            order.communityTokenAmount -
            communityTokenAmount;

        order.governanceTokenAmount =
            order.governanceTokenAmount -
            governanceTokenAmount;

        order.crdBalance = order.crdBalance - amount - fees;

        if (
            order.communityTokenAmount == 0 && order.governanceTokenAmount == 0
        ) {
            order.isClosed = true;
            emit OrderClose({
                saleId: saleId,
                creationDate: block.timestamp,
                remainingBalance: 0
            });
        }
    }

    /// @notice This is only for internal use
    /// @dev This function is responsible to transfer the tokens at the time of purchase and
    /// it is also responsible for transferring the fees.
    /// @param tokenAmount This is the amount of token to transfer
    /// @param tokenPrice This is the token price at which the tokens are being sold at
    /// @param tokenId this is the ID of the token to transfer
    function _transferTokensAndTransactionCharge(
        uint256 tokenAmount,
        uint256 tokenPrice,
        uint256 tokenId,
        address receiver
    ) internal returns (uint256 totalCost, uint256 totalFee) {
        // Change the function so that it will transfer the community and governance tokens from the sellers
        //account to buyer account then it would transfer the CRD tokens from contract account to sellers
        //account after deducting the transaction fees.

        uint256 transactionAmount = (tokenAmount * tokenPrice);
        uint256 transactionFee = (transactionAmount * TRANSACTION_FEE) / 10000;
        //Removing the transaction fee from the transaction amount
        transactionAmount = transactionAmount - transactionFee;

        ITreasuryCore treasuryCoreContract = ITreasuryCore(
            TREASURY_CORE_CONTRACT_ADDRESS
        );

        treasuryCoreContract.safeTransferFrom(
            msg.sender,
            WALLET_ADDRESS,
            treasuryCoreContract.CRD(),
            transactionFee,
            "Sale transaction fee"
        );

        treasuryCoreContract.safeTransferFrom(
            address(this),
            msg.sender,
            treasuryCoreContract.CRD(),
            transactionAmount,
            "Sale token price amount transfer to seller"
        );

        treasuryCoreContract.safeTransferFrom(
            msg.sender,
            receiver,
            tokenId,
            tokenAmount,
            "Sale token transfer to buyer"
        );

        return (transactionAmount, transactionFee);
    }

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
