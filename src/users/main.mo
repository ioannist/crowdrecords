// Import base modules
import AssocList "mo:base/AssocList";
import Error "mo:base/Error";
import List "mo:base/List";
import Types "./types";
import Database "./database"; 
import Principal "mo:base/Principal";
import TokensCanister "canister:tokens";

actor class() {

    var directory: Database.Directory = Database.Directory();

    type NewProfile = Types.NewProfile;
    type Profile = Types.Profile;
    type UserId = Types.UserId;

    public shared({ caller }) func createUser(profile : NewProfile) : async Principal {
       directory.createNewUser(caller,profile);
       await TokensCanister.initializeEmptyValuesForUser(caller);
       caller; 
    };

    public shared({ caller }) func getUser() : async ?Profile {
       directory.getUser(caller); 
    };

    public shared({ caller }) func checkIfUserLoogedIn() : async Bool {
        if(Principal.toText(caller) == "2vxsx-fae") {
            return false;
        };
        return true;
    };

    public shared({ caller }) func whoAmI() : async Principal {
        caller;
    };
    
};
