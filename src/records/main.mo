// Import base modules
import AssocList "mo:base/AssocList";
import Error "mo:base/Error";
import List "mo:base/List";
import Types "./types";
import Database "./database"; 
import Principal "mo:base/Principal";

actor Tokens {

    type VotingId = Types.VotingId;
    type Voting = Types.Voting;
    type FROZEN_Voting = Types.FROZEN_Voting;
    type Records = Types.Records;
    type RecordId = Types.RecordId;
    type NewRecords = Types.NewRecords;
    type ContributionId = Types.ContributionId;
    type UserId = Types.UserId;
    type NewContribution = Types.NewContribution;
    type NewTokenData = Types.NewTokenData;

    var directory: Database.Directory = Database.Directory();
    
    //This function is responsible for creating a new record
    public shared({ caller }) func createRecord(newRecord: NewRecords,newContribution : NewContribution, communityTokenData : NewTokenData, governanceTokenData : NewTokenData) : async (RecordId){ 
        //A call will be made to db for creating a record
        //it will return record detial and record id.
        await directory.createRecord(caller,newRecord,newContribution,communityTokenData,governanceTokenData);
        // return 0;
        //Here we will call method of token cannister to mint tokens for this records.
    };


    //This function is responsible for creating a contribution and it will return the id of the contribution
    /*public shared({ caller }) func createContribution(recordId : RecordId) : async (ContributionId) { 
        //A call will be made to db for creating a contribution and it will return contribution id.
        directory.createContribution(caller,recordId);
    };*/

    //This function is responsible for publishing a contribution
    /*public shared({ caller }) func publishContribution(contributionId : ContributionId,resultDate : Int) { 
        //A call will be made to db for publishing the contribution.
        //Then a cron will be set to execute at the time of result declaration.
        directory.publishContribution(caller,contributionId,resultDate);
    };*/

    //This function is a cron function which will periodically check for voting that are going to be completed and then saves the result into db
    public shared({ caller }) func contributionVotingCron() { 
    };

    public shared({ caller }) func voteForContribution(votingId : VotingId, vote : Bool) : async ?FROZEN_Voting {
        let voting : ?Voting = directory.castVote(caller,votingId,vote);

        switch(voting){
            case(null){
                return null;
            };
            case(?voting){
                let frozedVoting : FROZEN_Voting = {
                    votingId = voting.votingId;
                    positiveVotes = voting.positiveVotes;
                    negativeVotes = voting.negativeVotes;
                    resultTime = voting.resultTime;
                };
                return ?frozedVoting;
            }
        };  
    };

    //This function takes record id as input and returns data of record.
    public shared({ caller }) func getRecord(recordId : RecordId) /*: Record*/{
    };

    //This function takes record id and contract parameters as input and it will create a contract,
    //The contract then will be subject to voting and now people can vote to the contract.
    public shared({ caller }) func proposeContract(recordId : RecordId) {
    };

    //This function is a cron function which will periodically check for voting that are going on for the contract
    //Params : ContractId, vote, userId
    public shared({ caller }) func contractVotingCron() { 
    };

    //This function is a cron function which will periodically check for voting that are going on for the contract
    //Params : ContractId, userId
    public shared({ caller }) func royaltyDistributionCron() { 
    };

    //This function is responsible for voting on contract.
    //Params : ContractId, vote, userId
    public shared({ caller }) func voteForContract() { 
    };
};