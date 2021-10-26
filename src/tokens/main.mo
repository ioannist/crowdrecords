// Import base modules
import AssocList "mo:base/AssocList";
import Error "mo:base/Error";
import List "mo:base/List";
import Types "./types";
import Database "./database"; 
import Principal "mo:base/Principal";

actor class() {

    var directory: Database.Directory = Database.Directory();

    type NewToken = Types.NewToken;
    type Token = Types.Token;
    type UserId = Types.UserId;
    type TokenMap = Types.TokenMap;
    type TokenType = Types.TokenType;


    public shared({ caller }) func createNewToken(newToken : NewToken) : async Nat32 {
       return directory.createNewTokens(caller,newToken); 
    };

//     type NewRecord = {
//         name : Text;
//         number : Nat;
//     };

//     let rec : NewRecord = {
//         name = "Parth";
//         number = 98766332;
//     }

//     type VariantExample = {
//         #name ;
//         #tag : Text;
//     };

//     let vEx : VariantExample = {
//         #name = "Parth";
//         #tag = "Tags";
//     };

//     public func name() : async (Text)  {
//         rec.name;
//     };

//     public func printVariant() : async (Text)  {
//         variantExample;
//     };


//   public func print2Vals(): async (Bool ,Text) {
//         (true,"das");
//     };


};
