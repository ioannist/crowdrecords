// Import base modules
import AssocList "mo:base/AssocList";
import Error "mo:base/Error";
import List "mo:base/List";
import Types "./types";
import Database "./database"; 
import Principal "mo:base/Principal";

actor Tokens {

    var directory: Database.Directory = Database.Directory();

    type NewToken = Types.NewToken;
    type Token = Types.Token;
    type UserId = Types.UserId;
    type TokenMap = Types.TokenMap;
    type TokenType = Types.TokenType;
    type TokenId = Types.TokenId;
    type RecordId = Types.RecordId;


    public shared({ caller }) func createTokens(userId: UserId,communityToken: NewToken,governanceToken: NewToken) : async (TokenId,TokenId){
        //hardcoding the id for user canister to limit access to this function
        //This function is only to be called from records cannister
        if(Principal.toText(caller) == "qjdve-lqaaa-aaaaa-aaaeq-cai") {
            let communityTokenId = directory.createTokens(userId,communityToken);
            let governanceTokenId = directory.createTokens(userId,governanceToken);
            (communityTokenId,governanceTokenId);
        }else{
           return (0,0);
        };
    };

    public shared({ caller }) func addRecord(recordId: RecordId) : async Bool {
        directory.addRecord(caller,recordId);
    };

    //This function only to be called from the canisters only this function doesn't needs to be called by user explicitly
    public shared({ caller }) func initializeEmptyValuesForUser(userId: UserId): async (){
        //hardcoding the id for user canister to limit access to this function
        if(Principal.toText(caller) == "qoctq-giaaa-aaaaa-aaaea-cai") {
            return;
        }else{
            directory.initializeEmptyValuesForUser(userId);
        };
    };

    //This function is expected to be called from Record cannister and it is repsonsible to transfer the contribution reward asked by the user once
    //the voting is over and the contribution is accepted
    public shared({ caller }) func transferContributionReward(){
        //hardcoding the id for user canister to limit access to this function
        //This function is only to be called from records cannister
        if(Principal.toText(caller) == "qjdve-lqaaa-aaaaa-aaaeq-cai") {
            //Action to transfer the assets from treasury to users wallet
        }else{
            
        };
    };
    
    //This function is returns the ICP Account address for specific record
    public shared({ caller }) func getRecordICPAccount(recordId : RecordId){

    };

    //This function is returns a list of Tokens own by a particular user
    public shared({ caller }) func getUserTokenList(userId : UserId) : async [TokenId]{
        directory.getUserTokenList(userId);
    };

    //This function is returns a list of Records own by a particular user
    public shared({ caller }) func getUserRecordList(userId : UserId) : async [RecordId]{
        directory.getUserRecordList(userId);
    };

    //This function is responsible for transfering the tokens from the senders account into recivers account.
    //The caller must be the sender himself so that the transaction can be authenticated
    public shared({ caller }) func transferTokens(reciverUserId : UserId){

    };

    //This function is responsible for miniting a tokens for any record 
    public shared({ caller }) func tokenMinting(reciverUserId : UserId,amount : Nat){

    };

    //This function is responsible for creating offer so that investor can come and purchase it.
    public shared({ caller }) func createTokenOffer(tokenAmount : Nat, icpAmount : Nat){

    };

    //This function is responsible for fetching list of offers available for tokens.
    public shared({ caller }) func getTokenOffer(tokenAmount : Nat, icpAmount : Nat){

    };

    //This function returns list of transfers made for tokens.
    public shared({ caller }) func getTransferHistory(){

    };

    //This function is responsible to add the record to list of users preowned records list
    public shared({ caller }) func addRecordToUserAccount(recordId : RecordId){

    };

};