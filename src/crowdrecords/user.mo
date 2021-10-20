// Import base modules
import AssocList "mo:base/AssocList";
import Error "mo:base/Error";
import List "mo:base/List";
import Array "mo:base/Array";
import Time "mo:base/Time"
import Principal "mo:base/Principal";

shared({ caller = initializer }) actor class() {

// ------------------ Creation and Managment ---------------------------///
    
    let hashMap = HashMap.HashMap<UserId, Profile>(1, isEq, Principal.hash);
    
    public type UserId = Principal;
    
    public type Profile = {
        userId:UserId;
        username: Text;
        wallet: Array;
        profileImage: Text;
        createdDate: Nat; 
    };

    public type NewProfile = {
        userId:UserId;
        username: Text;
        profileImage: Text;
    };

    // msg.caller to be sent as a unique identifier
    // public shared(msg) func createNewUser(userId: UserId,profile: NewProfile)
    // userId = msg.caller;

    public func createNewUser(userId: UserId,profile: NewProfile){
        Profile profile = {
            username: profile.username;
            profileImage: profile.profileImage;
            wallet:[];
            createdDate: Time.now();; 
        }
        hashMap.put(userId,profile); 
    }

    public func getUser(userId: UserId): ?Profile{
        hashMap.get(userId); 
    }


    func isEq(x: UserId, y: UserId): Bool { x == y };

};