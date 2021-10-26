// Import base modules
import AssocList "mo:base/AssocList";
import Error "mo:base/Error";
import List "mo:base/List";
import Types "./types";
import Database "./database"; 
import Principal "mo:base/Principal";

actor class() {

    var directory: Database.Directory = Database.Directory();

    type NewProfile = Types.NewProfile;
    type Profile = Types.Profile;
    type UserId = Types.UserId;

    public shared({ caller }) func createUser(profile : NewProfile) : async Principal {
       directory.createNewUser(caller,profile); 
       return caller;
    };

    public shared({ caller }) func getUserProfile() : async ?Profile {
       directory.getUser(caller); 
    };

    public shared({ caller }) func checkIfUserLoogedIn() : async Bool {
        if(Principal.toText(caller) == "2vxsx-fae") {
            return false;
        };
        return true;
    };

    public shared({ caller }) func addRecord(recordId: Text) : async Bool {
        directory.addRecord(caller,recordId);
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
