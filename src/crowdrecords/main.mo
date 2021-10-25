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
};
