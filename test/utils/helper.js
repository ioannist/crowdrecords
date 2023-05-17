const Web3 = require("web3");
const web3 = new Web3("ws://localhost:8545");

exports.VOTING_INTERVAL_BLOCKS = 40; // 10 min
exports.PROPOSAL_VOTING_TIME = 40; // 10 min  // 40320 blocks 7 days
exports.DILUTION_INTERVAL_BLOCKS = 1000;
// exports.SALE_TRANSACTION_FEE_PERCENT = 0.5;
exports.PLATFORM_FEES = "1000000000000000000"; // currently 1 ether for testing
exports.VOTING_DEPOSIT_MOCK_CONTRACT = "10000000000000000"; //0.01 ether
exports.VOTING_DEPOSIT_CONTRIBUTION_CONTRACT = "10000000000000000"; //0.01 ether
exports.VOTING_DEPOSIT_AGREEMENT_CONTRACT = "10000000000000000"; //0.01 ether
exports.VOTING_DEPOSIT_RECORD_VERSION_CONTRACT = "10000000000000000"; //0.01 ether
exports.VOTING_DEPOSIT_DILUTION_CONTRACT = "10000000000000000"; //0.01 ether
exports.GOV_VOTING_DELAY = 1;
exports.GOV_VOTING_PERIOD = 40; //10 mins //50400;
exports.GOV_VOTING_THRESHOLD = 0;

exports.advanceTime = (time) => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [time],
                id: new Date().getTime(),
            },
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            }
        );
    });
};

exports.advanceBlock = () => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_mine",
                id: new Date().getTime(),
            },
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            }
        );
    });
};

exports.advanceBlockAndSetTime = (time) => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_mine",
                params: [time],
                id: new Date().getTime(),
            },
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            }
        );
    });
};

exports.advanceTimeAndBlock = async (time) => {
    //capture current time
    let block = await web3.eth.getBlock("latest");
    let forwardTime = block["timestamp"] + time;

    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_mine",
                params: [forwardTime],
                id: new Date().getTime(),
            },
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            }
        );
    });
};

exports.takeSnapshot = () => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_snapshot",
                id: new Date().getTime(),
            },
            (err, snapshotId) => {
                if (err) {
                    return reject(err);
                }
                return resolve(snapshotId);
            }
        );
    });
};

exports.revertToSnapshot = (id) => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_revert",
                params: [id],
                id: new Date().getTime(),
            },
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            }
        );
    });
};

exports.getEthAccount = (accountNumber) => {
    return new Promise(async (resolve, reject) => {
        let accounts = await web3.eth.getAccounts();
        if (accounts) {
            if (accountNumber > accounts.length) return reject(undefined);

            return resolve(accounts[accountNumber]);
        }
        return reject(accounts);
    });
};

exports.getEthBalanceForAccount = (accountNumber) => {
    return new Promise(async (resolve, reject) => {
        let accounts = await web3.eth.getAccounts();
        if (accounts) {
            if (accountNumber > accounts.length) return reject(undefined);

            return resolve(
                await web3.utils.fromWei(await web3.eth.getBalance(accounts[accountNumber]))
            );
        }
        return reject(accounts);
    });
};

/**
 *
 * @param {Array} logs
 * @param {String} eventName
 * @param {String} errorMessage
 */
exports.checkIfEventEmitted = (logs, eventName, errorMessage) => {
    for (i in logs) if (logs[i].event == eventName) return;
    assert(false, errorMessage);
};

/**
 *
 * @param {Array} logs
 * @param {String} eventName
 * @param {String} errorMessage
 * @param {String} data the data you want to match with the event
 */
exports.checkIfEventData = (logs, eventName, errorMessage, data) => {
    for (i in logs) {
        if (logs[i].event == eventName) {
            for (k in data) {
                if (data[k]?.toString() != logs[i].args[k]?.toString()) {
                    return assert(false, errorMessage);
                }
            }
            return;
        }
    }
    return assert(false, errorMessage);
};

/**
 *
 * @param {Number} blockAmount - The amount of blocks you jump
 */
exports.advanceMultipleBlocks = async (blockAmount) => {
    while (blockAmount >= 0) {
        await this.advanceBlock();
        blockAmount--;
    }
};

