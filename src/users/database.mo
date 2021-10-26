import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Types "./types";
import Time "mo:base/Time";

module {
    type NewProfile = Types.NewProfile;
    type Profile = Types.Profile;
    type UserId = Types.UserId;

    public class Directory() {  

        func isEq(x: UserId, y: UserId): Bool { x == y };
        
        let hashMap = HashMap.HashMap<UserId, Profile>(1, isEq, Principal.hash);
            
        type NewProfile = Types.NewProfile;
        type Profile = Types.Profile;
        type UserId = Types.UserId;

        public func createNewUser(userId: UserId, newProfile: NewProfile){
            let profile : Profile = {
                userId = userId;
                username = newProfile.username;
                profileImage = newProfile.profileImage;
                coinWallet=[];
                recordWallet=[];
                createdDate=Time.now();
            };
            hashMap.put(userId,profile); 
        };

        public func getUserCount(): Nat{
            hashMap.size();
        };

        public func getUser(userId: UserId): ?Profile{
            hashMap.get(userId); 
        };

        public func getRecordsArray(userId: UserId): [Text]{
            var record : ?Profile = hashMap.get(userId);
            switch(record) {
                case(null) {
                    return [];
                };
                case(?record) {
                    return record.recordWallet;
                };
            };
        };

        public func addRecord(userId: UserId,recordId: Text): Bool{
            var record : ?Profile = hashMap.get(userId);
            switch(record) {
                case(null) {
                    return false;
                };
                case(?record) {
                    let recordArray = Array.append<Text>(record.recordWallet,[recordId]);
                    let profile : Profile = {
                        userId = record.userId;
                        username = record.username;
                        profileImage = record.profileImage;
                        coinWallet= record.coinWallet;
                        recordWallet= recordArray;
                        createdDate=record.createdDate;
                    };
                    hashMap.put(userId,profile);
                    return true;
                };
            };
        };

    }
};
