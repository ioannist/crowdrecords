import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Types "./types";
import Time "mo:base/Time";

module {
    public class Directory() {  

        type NewTrackData = Types.NewTrackData;
        type Tracks = Types.Tracks;
        type TrackId = Types.TrackId;

        let DRAFT : Int = 1;
        let PUBLISHED : Int = 0;

        //this is the hashmap which will store all the data of all the tokens and the tokens are identified by simple Nat32 number
        let allTracksList = HashMap.HashMap<Nat32, Tracks>(1, func (x: Nat32, y: Nat32): Bool { x == y }, func (a : Nat32) : Nat32 {a});

        //This is the counter of the token id.
        var lastTrackId : Nat32 = 0;    
       
        public func createNewTrack(userId: UserId,newTrackData: NewTrackData): Nat32{
            lastTrackId += 1;
            let track = {
                id: lastTrackId;
                userId: userId;
                draft: newTrackData.draft;
                independentTrack:newTrackData.independentTrack; 
                trackLinks: newTrackData.trackLinks; 
                trackHash: newTrackData.trackHash; 
            }; 
            allTracksList.put(lastTrackId,track); 
            lastTrackId;
        };

        public func publishTrack(userId: UserId,trackId: TrackId){
            var track : ?Tracks = allTracksList.get(trackId);
            switch(track) {
                case(null) {
                    return;
                };
                case(?track) {
                    var newTrackdata : Tracks = {
                        id: track.id;
                        userId: track.userId;
                        draft: PUBLISHED;
                        independentTrack:track.independentTrack; 
                        trackLinks: track.trackLinks; 
                        trackHash: track.trackHash; 
                    };
                    allTracksList.put(trackId,newTokenArr);
                    return;
                };
            };
        };

   }
}