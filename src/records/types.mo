import Principal "mo:base/Principal";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";

/*
    Making tracks a single track with basic properties 
*/
module {

    /*
        Default value for all ID with type INT is -1.
        Default value for all ID with type Nat and Nat32 is 0.
    */

    public type UserId = Principal;
    public type TrackId = Nat32;
    public type RecordId = Nat32;
    public type ContributionId = Nat32;
    public type VotingId = Nat32;
    public type RecordCategoryId = Nat32;
    public type TrackCategoryId = Nat32;
    public type TreasuryId = Nat32;
    
    //
    public type TrackCategory = {
        name: Text;
        id:TrackCategoryId;
        icon: Text; //Icon of the category
    };

    public type NewTrackData = {
        recordId: RecordId;
        // draft: Int;
        // independentTrack:Int; //this flag denotes if this track is a independent track or not, if it is independent then you can create a new record with this track as seed
        trackLink: Text; //link to the place where it is stored
        trackHash: Text; //Hashes of the file to verify if they are the same that were uploaded
        previewFile: Text; //This is the link of preview file that is mix of all the tracks
        trackCategory:TrackCategoryId;
    };

    public type Tracks = {
        id: TrackId;
        userId: UserId;
        recordId: RecordId;
        // draft: Int;
        // previewFile: Text; //This is the link of preview file that is mix of all the tracks
        // independentTrack:Int; //this flag denotes if this track is a independent track or not, if it is independent then you can create a new record with this track as seed
        trackLink: Text; //link to the place where it is stored
        trackHash: Text; //Hashes of the file to verify if they are the same that were uploaded
        trackCategory:TrackCategoryId;
        createdDate:Int; // Time stamp of when the track was uploaded
    };

    public type RecordCategory = {
        name: Text;
        id: RecordCategoryId;
        icon: Text; //Icon of the category
    };

    /*
    For creation of new record:
    1. A temp record id is genrated.
    2. All the tracks are uploaded one by one to IPFS and the track data is stored temporarily in the canister with the record ID
    3. Then once all the data is filled and create button is clicked it just transfers of the tracks from temporary store to database
    4. If nothing happens then after 48 hour a cron will execute and remove everything from the temp db
    */

    public type NewRecords = {
        name: Text;
        //If seed is not finalized then default value should be -1
        //seedId: ContributionId; // SeedId will be the seed contribution that is collection of base tracks 
        tracks: [TrackId];
        peerVersion: Nat32; //This refers to the id of record who seed has been used for creating this version if none then it will be -1
        // createdDate: Int; //This will be calculated by the server
        seedId: ContributionId;
        recordCategory: RecordCategoryId;
        // icpFundsWallet: Principal;
        // governanceToken: Nat32; //Id of governance token 
        // communityToken: Nat32; //Id of community token
        previewFile: Text; //This is the link of preview file that is mix of all the tracks
    };

    public type Records = {
        id: RecordId;
        name: Text;
        seedId: ContributionId; // SeedId will be the seed contribution that is collection of base tracks 
        tracks: [TrackId];
        peerVersion: RecordId; //This refers to the id of record who seed has been used for creating this version if none then it will be -1
        createdDate: Int;
        previewFile: Text; //This is the link of preview file that is mix of all the tracks
        recordCategory: RecordCategoryId;
        // icpFundsWallet: Principal;
        treasuryId: TreasuryId; // Treasury Id is the replacement for the governance token id and community token id
        // governanceToken: Nat32; //Id of governance token 
        // communityToken: Nat32; //Id of community token
        contributions: [ContributionId]; // this is the list of contributions that are done on this song.
    };

    public type TokenType = {
        #governance;#copyright 
    };

    public type NewTokenData = {
        // tokenType: TokenType; // the token type would be set by system
        symbol: Text;
        totalSupply: Nat;
        createrTokens: Nat;
        treasuryTokens: Nat;
    };


    //This is a basic reward object which contains the requirement of the contributor
    public type Reward = {
        communityToken: Nat32;
        governanceToken: Nat32;
        icpToken: Nat32;
    };

    //A voting event where users will be voting according to their likings for a contribution 
    public type Voting = {
        votingId: VotingId;
        var positiveVotes: [UserId];
        var negativeVotes: [UserId];
        var resultTime: Int; //Set the date on which result needs to be declared
    };

    public type FROZEN_Voting = {
        votingId: VotingId;
        positiveVotes: [UserId];
        negativeVotes: [UserId];
        resultTime: Int; //Set the date on which result needs to be declared
    };

    /*
    * This is the result of voting, it can be either one of these, by deafault it would be rejected.
    * If nobody votes then the contribution will be rejected.
    * 
    * The voteing result will be calculated at the end of the time given for voting and 
    * the weightage of users vote will be considered by calculating the tokens owned by the user at the time of result declaration.
    */
    public type VotingResults = {
        #accepted;#rejected;#pending;#tied; 
    };
    
    //This is the new contribution object, it contians the info that we will recive from users
    public type NewContribution = {
        tracksId: [TrackId];
        recordId: RecordId;
        mixFile: Text; //This is the file which contains the mix of the contribtion and the orignal record
        description: Text;
        reward: Reward; //This is a reward object in the data type it doesn't refer to the reward insted it will have the value within the record
    };

    //This is the contribution object, which contains the meta data for contribution.
    public type Contribution = {
        id: ContributionId;
        userId: UserId;
        recordId: RecordId;
        tracksId: [TrackId];
        mixFile: Text; //This is the file which contains the mix of the contribtion and the orignal record
        createdDate: Int;
        description: Text;
        reward: Reward; //This is a reward object in the data type it doesn't refer to the reward insted it will have the value within the record
        votingId: VotingId;
        votingResults: VotingResults;
    };

};