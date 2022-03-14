# Crowdrecords Contracts

The following are the name and scope of the Contracts 

    1. TokensContract
        - This is responsible for creation of record NFT and tokens.
        - Responsible for minting of new token.
        - This will also have the data of the CRD token.
    2. ContributionContract
        - For seed contribution
            - It will not contain any record Id
    3. TracksContract
        - This will contain all the data regarding the tracks
        - For the seed tracks
            - This will not contain record Id
    4. TreasuryContract
        - This will maintain all the minting actions after the initial creation of tokens
    5. TracksContract



## Attributes of tokens
### Records
    1. name
    2. image
    3. seedId
    4. parentId
    5. recordCategory
    6. creationDate
    7. communityToken
    8. governanceToken

### Contribution
    1. tracks
    2. createdAt
    3. previewFile
    4. recordId
    5. roughMix (Boolean)
    6. communityTokenReward
    7. governanceTokenReward
    8. status (Pending | Accepted | Rejected)
    9. description

### Token
    1. name
    2. symbol
    3. type
    4. recordId

### Tracks
    1. fileHash
    2. fileLink
    3. category
    4. contributorId
