import Principal "mo:base/Principal";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";

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

    public type NewTrackData = {
        draft: Int;
        independentTrack:Int; //this flag denotes if this track is a independent track or not, if it is independent then you can create a new record with this track as seed
        trackLinks: [Text]; //link to the place where it is stored
        trackHash: [Text]; //Hashes of the file to verify if they are the same that were uploaded
        previewFile: Text; //This is the link of preview file that is mix of all the tracks
    };

    public type Tracks = {
        id: TrackId;
        userId: UserId;
        draft: Int;
        previewFile: Text; //This is the link of preview file that is mix of all the tracks
        independentTrack:Int; //this flag denotes if this track is a independent track or not, if it is independent then you can create a new record with this track as seed
        trackLinks: [Text]; //link to the place where it is stored
        trackHash: [Text]; //Hashes of the file to verify if they are the same that were uploaded
    };

    public type NewRecords = {
        name: Text;
        //Seed id is the id of track that is at the seeed of the song
        //If seed is not finalized then default value should be -1
        seedId: TrackId;
        tracks: [Tracks];
        peerVersion: Nat32; //This refers to the id of record who seed has been used for creating this version if none then it will be -1
        createdDate: Int;
        // icpFundsWallet: Principal;
        // governanceToken: Nat32; //Id of governance token 
        // communityToken: Nat32; //Id of community token
        previewFile: Text; //This is the link of preview file that is mix of all the tracks
    };

    public type Records = {
        id: RecordId;
        name: Text;
        seedId: TrackId;
        tracks: [Tracks];
        peerVersion: RecordId; //This refers to the id of record who seed has been used for creating this version if none then it will be -1
        createdDate: Int;
        previewFile: Text; //This is the link of preview file that is mix of all the tracks
        // icpFundsWallet: Principal;
        governanceToken: Nat32; //Id of governance token 
        communityToken: Nat32; //Id of community token
        contributions: [ContributionId]; // this is the list of contributions that are done on this song.
    };

    public type TokenType = {
        #governance;#copyright 
    };

    public type NewTokenData = {
        tokenType: TokenType;
        symbol: Text;
        totalSupply: Nat;
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