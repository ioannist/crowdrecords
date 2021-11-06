import Principal "mo:base/Principal";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";

module {
    public type UserId = Principal;
    public type TrackId = Nat32;

    public type NewTrackData = {
        draft: Int;
        independentTrack:Int; //this flag denotes if this track is a independent track or not, if it is independent then you can create a new record with this track as seed
        trackLinks: [Text]; //link to the place where it is stored
        trackHash: [Text]; //Hashes of the file to verify if they are the same that were uploaded
    }

    public type Tracks = {
        id: TrackId;
        userId: UserId;
        draft: Int;
        independentTrack:Int; //this flag denotes if this track is a independent track or not, if it is independent then you can create a new record with this track as seed
        trackLinks: [Text]; //link to the place where it is stored
        trackHash: [Text]; //Hashes of the file to verify if they are the same that were uploaded
    } 

    public type Records = {
        id: Nat32;
        name: Text;
        seedId: Text;
        tracks: [Tracks];
        peerVersion: Nat32; //This refers to the id of record who seed has been used for creating this version if none then it will be -1
        tokenMap: TokenMap;
        createdDate: Int;
        icpFundsWallet: Principal;
        governanceToken: Nat32; //Id of governance token 
        communityToken: Nat32; //Id of community token
    };


};