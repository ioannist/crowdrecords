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
    };

    public type TokenType = {
        #governance;#copyright 
    };

    public type NewTokenData = {
        tokenType: TokenType;
        symbol: Text;
        totalSupply: Nat;
    };

};