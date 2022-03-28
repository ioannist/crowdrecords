pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./votingContract.sol";

contract ContributionContract is ERC721 {
    //----------------------Permanent Uri code---------------------//
    /*  using Strings for uint256;

    // Optional mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;

    mapping(uint256 => bool) private _permanentURI;

    // Base URI
    string private _baseURIextended;

    function _setContirbutionURI(uint256 tokenId, string memory _tokenURI)
        internal
        virtual
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI set of nonexistent token"
        );

        require(
            _permanentURI[tokenId] != true,
            "ERC721Metadata: Metadata is not editable now"
        );

        _tokenURIs[tokenId] = _tokenURI;
    }

    function _lockContributionURI(uint256 tokenId) public virtual {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI set of nonexistent token"
        );

        require(
            _permanentURI[tokenId] == false,
            "ERC721Metadata: Metadata is already set to not editable"
        );

        _permanentURI[tokenId] = true;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseURIextended;
    }

    function _contributionURI(uint256 tokenId)
        public
        view
        virtual
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }
        // If there is a baseURI but no tokenURI, concatenate the tokenID to the baseURI.
        return string(abi.encodePacked(base, tokenId.toString()));
    } */

    //----------------------Contribution Related code---------------------//

    using Counters for Counters.Counter;
    Counters.Counter private _contributionIds;
    address OWNER;
    address public VOTING_CONTRACT_ADDRESS;

    event ContributionCreate(
        uint256 contributionId,
        uint256[] tracks,
        uint256 createdAt,
        string previewFile,
        string previewFileHash,
        uint256 recordId,
        bool seedContribution,
        bool roughMix,
        uint256 status,
        string description
    );

    struct Contribution {
        uint256[] tracks;
        uint256 createdAt;
        string previewFile;
        string previewFileHash;
        uint256 recordId;
        bool seedContribution;
        bool roughMix; // 1 if rough mix or else 0
        uint256 status; // status (PENDING = 1 | ACCEPTED = 2| REJECTED = 3)
        string description;
    }

    mapping(uint256 => Contribution) contributionData;

    constructor(string memory baseURI_) ERC721("Contributions", "CTRB") {
        // _baseURIextended = baseURI_;
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
     * @dev This function sets the Voting Contract address
     */
    function setVotingContractAddress(address newVotingContractAddress)
        public
        ownerOnly
    {
        VOTING_CONTRACT_ADDRESS = newVotingContractAddress;
    }

    /**
     * @dev This function will be called by the user to create a new contribution
     * @param tracks Id of tracks that are part of this contribution
     * @param previewFile this is preview file of the contribution
     * @param previewFileHash this is hash of the preview file
     * @param recordId this is the id of the record to which contribution belongs to.
     * @param roughMix this represents if a contribution is a roughMix or is a new contribution
     * @param description this is the description of the new contriution that is created.
     * @param communityReward this is the amount of community token that the contributor is requesting for his work contribution.
     * @param governanceReward this is the amount of governance token that the contributor is requesting for his work contribution.
     */
    function createNewContribution(
        // string memory uri,
        uint256[] memory tracks,
        string memory previewFile,
        string memory previewFileHash,
        uint256 recordId,
        bool roughMix,
        string memory description,
        uint256 communityReward,
        uint256 governanceReward
    ) public returns (uint256) {
        _contributionIds.increment();

        uint256 contributionId = _contributionIds.current();
        _mint(msg.sender, contributionId);

        VotingContract votingContract = VotingContract(VOTING_CONTRACT_ADDRESS);
        votingContract.createContributionVotingBallot(
            contributionId,
            msg.sender,
            governanceReward,
            communityReward
        );

        Contribution memory contribution = Contribution({
            tracks: tracks,
            createdAt: block.timestamp,
            previewFile: previewFile,
            previewFileHash: previewFileHash,
            recordId: recordId,
            roughMix: roughMix,
            status: 1,
            description: description,
            seedContribution: false
        });

        contributionData[contributionId] = contribution;

        emit ContributionCreate(
            contributionId,
            contribution.tracks,
            contribution.createdAt,
            contribution.previewFile,
            contribution.previewFileHash,
            contribution.recordId,
            contribution.seedContribution,
            contribution.roughMix,
            contribution.status,
            contribution.description
        );

        return contributionId;
    }

    /**
     * @dev This function will be called by the user to create a new seed contribution as there will be not voting or anything like that
     * @param tracks Id of tracks that are part of this contribution
     * @param previewFile this is preview file of the contribution
     * @param previewFileHash this is hash of the preview file
     * @param description this is the description of the new contriution that is created.
     */
    function createSeedContribution(
        // string memory uri,
        uint256[] memory tracks,
        string memory previewFile,
        string memory previewFileHash,
        string memory description
    ) public returns (uint256) {
        _contributionIds.increment();

        uint256 contributionId = _contributionIds.current();
        _mint(msg.sender, contributionId);

        bool seedContribution;

        Contribution memory contribution = Contribution({
            tracks: tracks,
            createdAt: block.timestamp,
            previewFile: previewFile,
            previewFileHash: previewFileHash,
            recordId: 0,
            roughMix: false,
            status: 2,
            description: description,
            seedContribution: true
        });

        contributionData[contributionId] = contribution;

        emit ContributionCreate(
            contributionId,
            contribution.tracks,
            contribution.createdAt,
            contribution.previewFile,
            contribution.previewFileHash,
            contribution.recordId,
            contribution.seedContribution,
            contribution.roughMix,
            contribution.status,
            contribution.description
        );

        return contributionId;
    }
}
