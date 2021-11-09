import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Types "./types";
import Time "mo:base/Time";
import TokensCanister "canister:tokens";

module {
    public class Directory() {  

        type NewTrackData = Types.NewTrackData;
        type Tracks = Types.Tracks;
        type TrackId = Types.TrackId;
        type RecordId = Types.RecordId;
        type UserId = Types.UserId;
        type NewRecords = Types.NewRecords;
        type Records = Types.Records;
        type NewTokenData = Types.NewTokenData;

        let DRAFT : Int = 1;
        let PUBLISHED : Int = 0;

        //this is the hashmap which will store all the data of all the tokens and the tokens are identified by simple Nat32 number
        let allTracksList = HashMap.HashMap<Nat32, Tracks>(1, func (x: Nat32, y: Nat32): Bool { x == y }, func (a : Nat32) : Nat32 {a});

        //This is the counter of the track id.
        var lastTrackId : TrackId = 0;    
        //This is the counter of the records id.
        var lastRecordId : RecordId = 0;    
       

        //This function takes the data and saves it in the hastable,
        //If the entry with the id exists then it will update the data or else it will create a new entry
        public func saveTrackDraft(userId: UserId,trackId: TrackId,newTrackData: NewTrackData): TrackId{
            var track : ?Tracks = allTracksList.get(trackId);
            switch(track) {
                case(null) {
                    lastTrackId += 1;
                    let track : Tracks = {   
                        id =  lastTrackId;
                        userId = userId;
                        draft = DRAFT;
                        independentTrack = newTrackData.independentTrack; 
                        previewFile = newTrackData.previewFile;
                        trackLinks = newTrackData.trackLinks; 
                        trackHash = newTrackData.trackHash; 
                    }; 
                    allTracksList.put(lastTrackId,track); 
                    lastTrackId;
                };
                case(?track) {
                    if(Principal.toText(track.userId) != Principal.toText(userId)){
                        //send some error saying you are not allowed to access this data
                        return 0;
                    }else if(track.draft == PUBLISHED){
                        //send some error saying it is already published 
                        return 0;
                    }else{
                      var newTrackdata : Tracks = {
                            id = trackId;
                            userId = track.userId;
                            draft = track.draft;
                            previewFile = newTrackData.previewFile;
                            independentTrack = newTrackData.independentTrack; 
                            trackLinks = newTrackData.trackLinks; 
                            trackHash = newTrackData.trackHash; 
                        };
                        allTracksList.put(trackId,newTrackdata);
                        return trackId;
                    };
                };
            };
        };

        //This function will publish the track with the data that was saved in the previous draft
        public func publishTrack(userId: UserId,trackId: TrackId){
            var track : ?Tracks = allTracksList.get(trackId);
            switch(track) {
                case(null) {
                    return;
                };
                case(?track) {
                    if(Principal.toText(track.userId) != Principal.toText(userId)){
                        //send some error saying you are not allowed to access this data
                        return;
                    }else{
                        var newTrackdata : Tracks = {
                            id = track.id;
                            userId = track.userId;
                            draft = PUBLISHED;
                            independentTrack = track.independentTrack; 
                            trackLinks = track.trackLinks; 
                            trackHash = track.trackHash; 
                            previewFile = track.previewFile;
                        };
                        allTracksList.put(trackId,newTrackdata);
                        return;
                    };
                };
            };
        };


        //This function will create records
        //It will first genrate the id and then it will create the tokens and get their ids. Then at last it will create a new Record
        public func createRecord(userId: UserId,governanceTokenData: NewTokenData,communityTokenData: NewTokenData,newRecords: NewRecords) : async RecordId{
            lastRecordId += 1;
            var recordId : RecordId = lastRecordId;
           
            var governanceToken = {
                recordId = recordId;
                tokenType = governanceTokenData.tokenType;
                symbol = governanceTokenData.symbol;
                totalSupply = governanceTokenData.totalSupply;
            };

            var communityToken = {
                recordId = recordId;
                tokenType = communityTokenData.tokenType;
                symbol = communityTokenData.symbol;
                totalSupply = communityTokenData.totalSupply;
            };

            var tokenIds : (Nat32,Nat32) = await TokensCanister.createNewTokens(userId,communityToken,governanceToken);
            
            let record : Records = {
                id = recordId;
                name = newRecords.name;
                seedId = newRecords.seedId;
                tracks = newRecords.tracks;
                peerVersion = newRecords.peerVersion;
                createdDate = Time.now();
                previewFile = newRecords.previewFile; 
                // icpFundsWallet = new Principal();
                communityToken = tokenIds.0;
                governanceToken = tokenIds.1;
            };
            recordId;
        };
   }
}
