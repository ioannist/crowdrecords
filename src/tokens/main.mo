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


    public shared({ caller }) func createNewTokens(userId: UserId,communityToken: NewToken,governanceToken: NewToken) : async (TokenId,TokenId){
        //hardcoding the id for user canister to limit access to this function
        //This function is only to be called from records cannister
        if(Principal.toText(caller) == "qjdve-lqaaa-aaaaa-aaaeq-cai") {
            return (0,0);
        }else{
            let communityTokenId = directory.createNewTokens(userId,communityToken);
            let governanceTokenId = directory.createNewTokens(userId,governanceToken);
            (communityTokenId,governanceTokenId);
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
    
};