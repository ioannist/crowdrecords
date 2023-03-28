// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./interface/IAuthManager.sol";
import "./interface/IBaseVoting.sol";
import "./voting/BaseVotingContract.sol";

contract GovernanceContract is BaseVotingContract {
    // mapping(string => uint) public ProposalInterval;
    uint256 public PROPOSAL_INTERVAL = 40320;
    uint256 public MIN_VOTING_BLOCKS = 1440; // this is minimum time for voting in other BaseVotingContracts
    mapping(string => address) public AddressMap;

    // hash for SUPER role
    bytes32 public constant SUPER_ROLE = keccak256("SUPER_ROLE");
    // hash for MEMBER
    bytes32 public constant MEMBER = keccak256("MEMBER");
    //
    uint256 internal constant NOT_FOUND = type(uint256).max;

    // mapping which contains roles for address
    mapping(address => bytes32[]) internal members;

    // event emitted when new member for role added
    event AddMember(address member, bytes32 role);
    // event emitted when member removed from role
    event RemoveMember(address member, bytes32 role);

    struct BallotData {
        uint votingParam;
        string contractKey;
        bool isPresent;
    }

    event VotingCreated(
        uint ballotId,
        uint votingParam,
        string contractKey,
        address creator
    );

    event VotingResult(
        uint ballotId,
        uint newValue,
        string contractKey,
        string action,
        bool result
    );

    /// @dev This is emitted when user votes for an ballot
    /// @param voter Address of the voter
    /// @param ballotId Id of the ballot where voting is stored
    /// @param vote State of vote : true for yes and false for No
    event GovernanceVoting(address voter, uint256 ballotId, bool vote);

    // Ballot Id => ballot data
    mapping(uint256 => BallotData) public minTurnOutVotingMap;
    // uint256 public lastMinTurnOutResult = 0;
    mapping(uint256 => BallotData) public depositAmountVotingMap;
    // uint256 public lastDepositAmountResult = 0;
    mapping(uint256 => BallotData) public votingPeriodVotingMap;

    // uint256 public lastVotingPeriodResult = 0;
    // uint256 public lastProposalResult = 0;

    // mapping(string => string) public ProposalFunctionName;

    // "DAO functionalities :
    //// - inc/dec the minTurnOut
    // - inc/dec the maxDilution limit for tokens
    //// - inc/dec the contribution creation deposit amount
    //// - inc/dec the records creation deposit amount
    //// - inc/dec the agreement creation deposit amount
    //// - inc/dec the dilution creation deposit amount
    //// - inc/dec the voting block period for contribution voting
    //// - inc/dec the voting block period for records voting
    //// - inc/dec the voting block period for agreement voting
    //// - inc/dec the voting block period for dilution voting"

    constructor(address owner, uint votingPeriod) BaseVotingContract(owner) {
        VOTING_BLOCK_PERIOD = votingPeriod;
    }

    modifier hasRole(address userAddress, bytes32 role) {
        bytes32[] storage _roles = members[userAddress];
        require(_find(_roles, role) != NOT_FOUND, "UNAUTHORIZED");
        _;
    }

    /// @notice Add new role for member. Only SUPER_ROLE can add new roles
    /// @param role - hash of a role string
    /// @param member - address of member
    function add(
        bytes32 role,
        address member
    ) external hasRole(msg.sender, SUPER_ROLE) {
        bytes32[] storage _roles = members[member];
        require(_find(_roles, role) == NOT_FOUND, "ALREADY_MEMBER");
        _roles.push(role);
        emit AddMember(member, role);
    }

    /// @notice Remove role from member. Only SUPER_ROLE can add new roles
    /// @param role - hash of a role string
    /// @param member - address of member
    function remove(
        bytes32 role,
        address member
    ) external hasRole(msg.sender, SUPER_ROLE) {
        require(msg.sender != member || role != SUPER_ROLE, "INVALID");
        bytes32[] storage _roles = members[member];
        uint256 i = _find(_roles, role);
        require(i != NOT_FOUND, "MEMBER_NOT_FOUND");
        if (_roles.length == 1) {
            delete members[member];
        } else {
            if (i < _roles.length - 1) {
                _roles[i] = _roles[_roles.length - 1];
            }
            _roles.pop();
        }
        emit RemoveMember(member, role);
    }

    /// @notice Search _role index in _roles array
    /// @param _roles - array of roles hashes
    /// @param _role - hash of role string
    function _find(
        bytes32[] storage _roles,
        bytes32 _role
    ) internal view returns (uint256) {
        for (uint256 i = 0; i < _roles.length; ++i) {
            if (_role == _roles[i]) {
                return i;
            }
        }
        return NOT_FOUND;
    }

    /// @dev This is to set the address of the contracts
    /// @param newTreasuryContractAddress This is the address of new treasury contract
    /// @param contributionVoting This is the address of contribution voting
    /// @param recordsVoting This is the address of records voting contract
    /// @param agreementContract This is the address of agreement contract
    /// @param dilutionContract This is the address of dilution contract
    /// @param superUser This is the address of the super user of the contract
    function initialize(
        address newTreasuryContractAddress,
        address contributionVoting,
        address recordsVoting,
        address agreementContract,
        address dilutionContract,
        address superUser
    ) public initializer _ownerOnly {
        BaseVotingContract.initialize(
            newTreasuryContractAddress,
            address(this)
        );

        AddressMap["contributionVotingContract"] = contributionVoting;
        AddressMap["recordsVotingContract"] = recordsVoting;
        AddressMap["agreementVotingContract"] = agreementContract;
        AddressMap["dilutionVoting"] = dilutionContract;

        if (superUser == address(0)) {
            members[msg.sender] = [SUPER_ROLE];
            emit AddMember(msg.sender, SUPER_ROLE);
        } else {
            members[superUser] = [SUPER_ROLE];
            emit AddMember(superUser, SUPER_ROLE);
        }
    }

    function castVote(uint256 ballotId, bool vote) public {
        super._castVote(ballotId, vote);

        emit GovernanceVoting({
            ballotId: ballotId,
            voter: tx.origin,
            vote: vote
        });
    }

    /// @dev This function is called to create a proposal for changing minTurnOut value for a specific contract
    /// @param newMinTurnOutPercent this is the new minTurnOut value, 1% = 100, 10% = 1000
    /// @param contractKey this is the key that specifies which contract we are creating minTurnOut proposal for
    function createMinTurnOutVoting(
        uint newMinTurnOutPercent,
        string memory contractKey
    ) public hasRole(msg.sender, MEMBER) {
        require(AddressMap[contractKey] != address(0), "NO_CONTRACT_FOUND");

        uint ballotId = _createVoting(true, 1);

        BallotData memory ballot = BallotData({
            votingParam: newMinTurnOutPercent,
            contractKey: contractKey,
            isPresent: true
        });

        minTurnOutVotingMap[ballotId] = ballot;

        emit VotingCreated({
            ballotId: ballotId,
            votingParam: newMinTurnOutPercent,
            contractKey: contractKey,
            creator: msg.sender
        });
    }

    /// @dev Result declaration for the minTurnOut change proposal
    /// @param ballotId A valid minTurnOut ballotId
    function declareMinTurnOutVoting(uint ballotId) public {
        require(minTurnOutVotingMap[ballotId].isPresent, "INV_BALLOT");
        // lastProposalResult = block.number;

        (bool result, ) = _declareWinner(ballotId);

        IBaseVoting baseVoting = IBaseVoting(
            AddressMap[minTurnOutVotingMap[ballotId].contractKey]
        );

        emit VotingResult({
            ballotId: ballotId,
            newValue: minTurnOutVotingMap[ballotId].votingParam,
            contractKey: minTurnOutVotingMap[ballotId].contractKey,
            action: "minTurnOut",
            result: result
        });

        baseVoting.setMinTurnOut(minTurnOutVotingMap[ballotId].votingParam);
    }

    /// @dev This function is called to create a proposal for changing Deposit value for a
    /// specific voting creation contract
    /// @param newDepositAmount this is the new deposit amount the amount is accepted in wei
    /// @param contractKey this is the key that specifies which contract we are creating depositAmount proposal for
    function createDepositAmountVoting(
        uint newDepositAmount,
        string memory contractKey
    ) public hasRole(msg.sender, MEMBER) {
        require(AddressMap[contractKey] != address(0), "NO_CONTRACT_FOUND");

        uint ballotId = _createVoting(true, 1);

        BallotData memory ballot = BallotData({
            votingParam: newDepositAmount,
            contractKey: contractKey,
            isPresent: true
        });

        depositAmountVotingMap[ballotId] = ballot;

        emit VotingCreated({
            ballotId: ballotId,
            votingParam: newDepositAmount,
            contractKey: contractKey,
            creator: msg.sender
        });
    }

    /// @dev Result declaration for the depositAmount change proposal
    /// @param ballotId A valid depositAmount ballotId
    function declareDepositAmountVoting(uint ballotId) public {
        require(depositAmountVotingMap[ballotId].isPresent, "INV_BALLOT");
        // lastProposalResult = block.number;

        (bool result, ) = _declareWinner(ballotId);

        IBaseVoting baseVoting = IBaseVoting(
            AddressMap[depositAmountVotingMap[ballotId].contractKey]
        );

        emit VotingResult({
            ballotId: ballotId,
            newValue: depositAmountVotingMap[ballotId].votingParam,
            contractKey: depositAmountVotingMap[ballotId].contractKey,
            action: "depositAmount",
            result: result
        });

        baseVoting.setDepositAmount(
            depositAmountVotingMap[ballotId].votingParam
        );
    }

    /// @dev This function is called to create a proposal for changing Voting Period for any baseVoting contract
    /// @param newVotingPeriod this is the new voting period, it is in blocks
    /// @param contractKey this is the key that specifies which contract we are creating depositAmount proposal for
    function createVotingPeriodVoting(
        uint newVotingPeriod,
        string memory contractKey
    ) public hasRole(msg.sender, MEMBER) {
        require(newVotingPeriod > MIN_VOTING_BLOCKS, "INV_VALUE");
        require(AddressMap[contractKey] != address(0), "NO_CONTRACT_FOUND");

        uint ballotId = _createVoting(true, 1);

        BallotData memory ballot = BallotData({
            votingParam: newVotingPeriod,
            contractKey: contractKey,
            isPresent: true
        });

        votingPeriodVotingMap[ballotId] = ballot;

        emit VotingCreated({
            ballotId: ballotId,
            votingParam: newVotingPeriod,
            contractKey: contractKey,
            creator: msg.sender
        });
    }

    /// @dev Result declaration for the Voting Period change proposal
    /// @param ballotId A valid Voting Period ballotId
    function declareVotingPeriodVoting(uint ballotId) public {
        require(votingPeriodVotingMap[ballotId].isPresent, "INV_BALLOT");
        // lastProposalResult = block.number;

        (bool result, ) = _declareWinner(ballotId);

        IBaseVoting baseVoting = IBaseVoting(
            AddressMap[votingPeriodVotingMap[ballotId].contractKey]
        );

        emit VotingResult({
            ballotId: ballotId,
            newValue: votingPeriodVotingMap[ballotId].votingParam,
            contractKey: votingPeriodVotingMap[ballotId].contractKey,
            action: "votingPeriod",
            result: result
        });

        baseVoting.setVotingPeriod(votingPeriodVotingMap[ballotId].votingParam);
    }
}
