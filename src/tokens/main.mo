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


    public shared({ caller }) func createNewToken(newToken : NewToken) : async Nat32 {
       return directory.createNewTokens(caller,newToken); 
    };

    public shared({ caller }) func addRecord(recordId: Text) : async Bool {
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