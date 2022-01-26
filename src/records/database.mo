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
        type Contribution = Types.Contribution;
        type ContributionId = Types.ContributionId;
        type VotingId = Types.VotingId;
        type Voting = Types.Voting;
        type Reward = Types.Reward;
        type NewContribution = Types.NewContribution;
        type VotingResults = Types.VotingResults;
        type TreasuryId = Types.TreasuryId;

        let DRAFT : Int = 1;
        let PUBLISHED : Int = 0;

        //This will hold the tracks details temporarily for 48 hours.
        //The age will be identified from the creation date of the track
        let tempTracks = HashMap.HashMap<TrackId, Tracks>(1, func (x: Nat32, y: Nat32): Bool { x == y }, func (a : Nat32) : Nat32 {a});
        
        //–––––––––––––––
        //Curently no need to hold the contribution into temporary hash map
        //This will hold the contribution Ids for tempora
        // let tempContributions = HashMap.HashMap<ContributionId, Contribution>(1, func (x: Nat32, y: Nat32): Bool { x == y }, func (a : Nat32) : Nat32 {a});
        //–––––––––––––––

        //this is the hashmap which will store all the data of all the tokens and the tokens are identified by simple Nat32 number
        let allTracksList = HashMap.HashMap<TrackId, Tracks>(1, func (x: Nat32, y: Nat32): Bool { x == y }, func (a : Nat32) : Nat32 {a});
        //this is the hashmap which will store all the data of all the records
        let allRecordsList = HashMap.HashMap<RecordId, Records>(1, func (x: Nat32, y: Nat32): Bool { x == y }, func (a : Nat32) : Nat32 {a});

        //The below list will hold all the contributions that are accepted by the community.
        let acceptedContributions = HashMap.HashMap<ContributionId, Contribution>(1, func (x: Nat32, y: Nat32): Bool { x == y }, func (a : Nat32) : Nat32 {a});
        /*
            The below list will hold all the contributions that are currently under voting.
            Any contribution that is not accepted or it's result is pending will reside in this particular array
        */ 
        let pendingContributions = HashMap.HashMap<ContributionId, Contribution>(1, func (x: Nat32, y: Nat32): Bool { x == y }, func (a : Nat32) : Nat32 {a});



        //All the pending Votings will be stored in the following hashmap and once it's result is declared it will be stored into completedVoting HashMap
        let pendingVotings = HashMap.HashMap<VotingId, Voting>(1, func (x: Nat32, y: Nat32): Bool { x == y }, func (a : Nat32) : Nat32 {a});
        //All the votings will be stored in the following hashmap once it's result is anounced
        let completedVotings = HashMap.HashMap<VotingId, Voting>(1, func (x: Nat32, y: Nat32): Bool { x == y }, func (a : Nat32) : Nat32 {a});


        //This is the counter of the track id.
        var lastTrackId : TrackId = 0;    
        //This is the counter of the records id.
        var lastRecordId : RecordId = 0;    
        //This is the counter of the contribution id.
        var lastContributiondId : ContributionId = 0;    
        //This is the counter of the voting id.
        var lastVotingId : VotingId = 0;    
        
        //get a temporary record ID
        public func tempRecordId(): RecordId{
            lastRecordId += 1; 
            return lastRecordId;
        };

        //upload tracks to temporary hashtable
        public func uploadTempTracks(userId: UserId, newTrackData: NewTrackData): ContributionId{
            lastTrackId += 1; 
            var trackId = lastTrackId;
            var track : Tracks = {
                id = trackId;
                recordId = newTrackData.recordId;
                userId = userId;
                trackLink = newTrackData.trackLink;
                trackHash = newTrackData.trackHash;
                trackCategory = newTrackData.trackCategory;
                createdDate = Time.now();
            };
            tempTracks.put(lastTrackId,track);
            return lastTrackId;
        };

        //TO BE REMOVED
        //This function takes the data and saves it in the hastable,
        //If the entry with the id exists then it will update the data or else it will create a new entry
        // public func saveTrackDraft(userId: UserId,trackId: TrackId,newTrackData: NewTrackData): TrackId{
        //     var track : ?Tracks = allTracksList.get(trackId);
        //     switch(track) {
        //         case(null) {
        //             lastTrackId += 1;
        //             let track : Tracks = {   
        //                 id =  lastTrackId;
        //                 userId = userId;
        //                 draft = DRAFT;
        //                 independentTrack = newTrackData.independentTrack; 
        //                 previewFile = newTrackData.previewFile;
        //                 trackLinks = newTrackData.trackLinks; 
        //                 trackHash = newTrackData.trackHash; 
        //             }; 
        //             allTracksList.put(lastTrackId,track); 
        //             lastTrackId;
        //         };
        //         case(?track) {
        //             if(Principal.toText(track.userId) != Principal.toText(userId)){
        //                 //send some error saying you are not allowed to access this data
        //                 return 0;
        //             }else if(track.draft == PUBLISHED){
        //                 //send some error saying it is already published 
        //                 return 0;
        //             }else{
        //               var newTrackdata : Tracks = {
        //                     id = trackId;
        //                     userId = track.userId;
        //                     draft = track.draft;
        //                     previewFile = newTrackData.previewFile;
        //                     independentTrack = newTrackData.independentTrack; 
        //                     trackLinks = newTrackData.trackLinks; 
        //                     trackHash = newTrackData.trackHash; 
        //                 };
        //                 allTracksList.put(trackId,newTrackdata);
        //                 return trackId;
        //             };
        //         };
        //     };
        // };

        //TO BE REMOVED
        //This function will publish the track with the data that was saved in the previous draft
        // public func publishTrack(userId: UserId,trackId: TrackId){
        //     var track : ?Tracks = allTracksList.get(trackId);
        //     switch(track) {
        //         case(null) {
        //             return;
        //         };
        //         case(?track) {
        //             if(Principal.toText(track.userId) != Principal.toText(userId)){
        //                 //send some error saying you are not allowed to access this data
        //                 return;
        //             }else{
        //                 var newTrackdata : Tracks = {
        //                     id = track.id;
        //                     userId = track.userId;
        //                     draft = PUBLISHED;
        //                     independentTrack = track.independentTrack; 
        //                     trackLinks = track.trackLinks; 
        //                     trackHash = track.trackHash; 
        //                     previewFile = track.previewFile;
        //                 };
        //                 allTracksList.put(trackId,newTrackdata);
        //                 return;
        //             };
        //         };
        //     };
        // };


        //create a contribution object id in temp contribution
        //TOBE: Removed 
        // public func tempContributionId(userId: UserId,recordId : RecordId): ContributionId{
        //     lastContributiondId += 1; 
        //     var contributionId = lastContributiondId;
        //     var contribution : Contribution = {
        //         id = contributionId;
        //         recordId = recordId;
        //         userId = userId;
        //         tracksId = [];
        //         mixFile = "";
        //         description = "";
        //         reward = {communityToken=0;governanceToken=0;icpToken=0};
        //         createdDate = Time.now();
        //         votingId= 0;
        //         votingResults= #pending;
        //     };
        //     tempContributions.put(contributionId,contribution);
        //     return contributionId;
        // };

        //This function is responsible to create records and the seed contribution
        public func createRecord(userId : UserId, newRecord: NewRecords,newContribution : NewContribution, communityTokenData : NewTokenData, governanceTokenData : NewTokenData): async (RecordId){
            lastRecordId += 1;
            var recordId = lastRecordId;
            
            lastContributiondId += 1; 
            var contributionId = lastContributiondId;
            //This configs are only for seed contribution
            var contribution : Contribution = {
                id = contributionId;
                recordId = recordId;
                userId = userId;
                tracksId = newContribution.tracksId;
                mixFile = newContribution.mixFile;
                description = newContribution.description;
                reward = {communityToken=0;governanceToken=0;icpToken=0};
                createdDate = Time.now();
                votingId = 0;
                votingResults= #accepted;
            };
            //Seed contribution is directly accepted as a contribution no need to have a voting
            acceptedContributions.put(contributionId,contribution);
 
            //Transfer the tracks from the temp into the alltrackslist
            for(trackId in Iter.fromArray(newContribution.tracksId)){
                let trackData : ?Tracks = tempTracks.remove(trackId);
                switch(trackData){
                    case (null){
                        var a : Nat32 = 0;
                    };
                    case (?trackData){
                        allTracksList.put(trackId,trackData);
                    };
                }
            };
           
            var governanceToken = {
                recordId = recordId;
                tokenType = #governance;
                symbol = governanceTokenData.symbol;
                totalSupply = governanceTokenData.totalSupply;
                createrTokens = governanceTokenData.createrTokens;
                treasuryTokens = governanceTokenData.treasuryTokens;
            };

            var communityToken = {
                recordId = recordId;
                tokenType = #copyright;
                symbol = communityTokenData.symbol;
                totalSupply = communityTokenData.totalSupply;
                createrTokens = communityTokenData.createrTokens;
                treasuryTokens = communityTokenData.treasuryTokens;
            };

            var treasuryId : TreasuryId = await TokensCanister.createTokens(userId,communityToken,governanceToken);
            
            let record : Records = {
                contributions = [];
                createdDate = Time.now();
                id = recordId;
                name = newRecord.name;
                peerVersion = newRecord.peerVersion;
                previewFile = newRecord.previewFile; 
                recordCategory = newRecord.recordCategory;
                seedId = newRecord.seedId;
                tracks = newRecord.tracks;
                // icpFundsWallet = new Principal();
                // communityToken = tokenIds.0; //The first value in the data that is retured is the id of the communityToken.
                // governanceToken = tokenIds.1; //The second value in the data is the id of governance token.
                treasuryId = treasuryId;
            };
            allRecordsList.put(recordId,record);
            return recordId;
        };

        //create a contribution object id in temp contribution
        // public func createContribution(userId: UserId,recordId : RecordId): ContributionId{
        //     lastContributiondId += 1; 
        //     var contributionId = lastContributiondId;
        //     var contribution : Contribution = {
        //         id = contributionId;
        //         recordId = recordId;
        //         userId = userId;
        //         tracksId = [];
        //         mixFile = "";
        //         description = "";
        //         reward = {communityToken=0;governanceToken=0;icpToken=0};
        //         createdDate = Time.now();
        //         votingId= 0;
        //         votingResults= #pending;
        //     };
        //     tempContributions.put(contributionId,contribution);
        //     return contributionId;
        // };

        //publishing a contribution object and moving it from temp to pending
        // public func publishContribution(userId: UserId,contributionId : ContributionId,resultDate : Int){
        //     var contribution : ?Contribution = tempContributions.remove(contributionId);
        //     switch(contribution){
        //         case (null){
        //             return;
        //         };
        //         case (?contribution){
        //             lastVotingId := lastVotingId + 1;
        //             var votingId = lastVotingId;
        //             var voting : Voting = {
        //                 votingId = votingId;
        //                 var positiveVotes = [];
        //                 var negativeVotes = [];
        //                 var resultTime = resultDate;
        //             };
        //             pendingVotings.put(votingId,voting);
        //             var newContribution : Contribution = {
        //                 id = contributionId;
        //                 recordId = contribution.recordId;
        //                 userId = contribution.userId;
        //                 tracksId = contribution.tracksId;
        //                 mixFile = contribution.mixFile;
        //                 description = contribution.description;
        //                 reward = contribution.reward;
        //                 createdDate = Time.now();
        //                 votingId = votingId;
        //                 votingResults= #pending;
        //             };
        //             pendingContributions.put(contributionId,newContribution);
        //             return;
        //         };
        //     };
        // };

        //Voting function when users will vote on a contribution or event 
        public func castVote(userId: UserId,votingId : VotingId, vote : Bool): ?Voting{
            var voting : ?Voting = pendingVotings.get(votingId);
            switch(voting){
                case (null) {
                    return null;
                };
                case (?voting){
                    if(vote){
                        voting.positiveVotes := Array.append<UserId>(voting.positiveVotes,[userId]);
                    }else{
                        voting.negativeVotes := Array.append<UserId>(voting.negativeVotes,[userId]);
                    };
                    pendingVotings.put(votingId,voting);
                    return ?voting;
                };
            }
        };

        //uploading tracks to ICP for temp storage
        // public func tempUploadTracks(userId: UserId, newTrackData : NewTrackData): ContributionId{
        //     lastTrackId += 1; 
        //     var trackId = lastTrackId;
        //     var track : Tracks = {
        //         id = lastTrackId;
        //         userId = userId;
        //         recordId = newTrackData.recordId;
        //         trackLink = newTrackData.trackLink;
        //         trackHash = newTrackData.trackHash;
        //         trackCategory = newTrackData.trackCategory;
        //     };

        //     tempTracks.put();
        //     tempContributions.put(contributionId,contribution);
        //     return contributionId;
        // };


/*
TODO :  Currently need to figure out effecient way to store the Votings that are linked to the contributions as the number of Votings would keep increasing in time
Once the Voting is completed it should be either deleted or offloaded to some other store which is not frequently accessed.
*/
        //This function will take the published tracks and will create a contribution.


        //Currently THe function in the bottom is not complete and it will throw a lot of error.

     /*   public func contributeTo(userId: UserId,newContribution: NewContribution): ContributionId{

            var track : ?Tracks = allTracksList.get(trackId);
            lastContributiondId += 1; 
            var contribtionId : ContributionId = lastContributiondId;
            switch(track) {
                case(null) {
                    return;
                };
                case(?track) {
                    if(track.draft == DRAFT){
                        //send some error saying it is not published yet and to contribute you need to publish the track 
                        return 0;
                    }else{
                        var contribtion : Contribution = {
                            id = contribtionId;
                            recordId = newContribution.recordId;
                            userId = userId;
                            tracksId = newContribution.tracksId;
                            mixFile = newContribution.mixFile;
                            description = newContribution.description;
                            reward = newContribution.reward;
                            createdDate = Time.now();
                            description: newContribution.description;
                            votingId: VotingId;
                            votingResults: VotingResults.pending;

                        };
                        return;
                    };
                };
            };
        };
*/

        //This function will create records
        //It will first genrate the id and then it will create the tokens and get their ids. Then at last it will create a new Record
        // public func createRecord(userId: UserId,governanceTokenData: NewTokenData,communityTokenData: NewTokenData,newRecords: NewRecords) : async 
            
        //     RecordId{
        //     lastRecordId += 1;
        //     var recordId : RecordId = lastRecordId;
           
        //     var governanceToken = {
        //         recordId = recordId;
        //         tokenType = governanceTokenData.tokenType;
        //         symbol = governanceTokenData.symbol;
        //         totalSupply = governanceTokenData.totalSupply;
        //     };

        //     var communityToken = {
        //         recordId = recordId;
        //         tokenType = communityTokenData.tokenType;
        //         symbol = communityTokenData.symbol;
        //         totalSupply = communityTokenData.totalSupply;
        //     };

        //     var tokenIds : (Nat32,Nat32) = await TokensCanister.createTokens(userId,communityToken,governanceToken);
            
        //     let record : Records = {
        //         id = recordId;
        //         name = newRecords.name;
        //         seedId = newRecords.seedId;
        //         tracks = newRecords.tracks;
        //         peerVersion = newRecords.peerVersion;
        //         createdDate = Time.now();
        //         previewFile = newRecords.previewFile; 
        //         // icpFundsWallet = new Principal();
        //         communityToken = tokenIds.0; //The first value in the data that is retured is the id of the communityToken.
        //         governanceToken = tokenIds.1; //The second value in the data is the id of governance token.
        //         contributions = [];
        //     };
        //     allRecordsList.put(recordId,record);
        //     recordId;
        // };
   }
}
