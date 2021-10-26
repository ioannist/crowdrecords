import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Types "./types";
import Time "mo:base/Time";

module {
    public class Directory() {  

        func isEq(x: Nat32, y: Nat32): Bool { x == y };
        
        
        let hashMap = HashMap.HashMap<Nat32, Token>(1, isEq, func (a : Nat32) : Nat32 {a});
      
        var lastId : Nat32 = 0;    

        type NewToken = Types.NewToken;
        type Token = Types.Token;
        type UserId = Types.UserId;
        type TokenMap = Types.TokenMap;
        type TokenType = Types.TokenType;

        public func createNewTokens(userId: UserId,newToken: NewToken): Nat32{
            lastId += 1;    
            let tokenMap : TokenMap = HashMap.HashMap<UserId,Nat>(1, func (x: UserId, y: UserId): Bool { x == y }, Principal.hash);
            tokenMap.put(userId,newToken.totalSupply);
            let token = {
                id = lastId;
                recordId = newToken.recordId;
                tokenType = newToken.tokenType;
                tokenMap = tokenMap;
                totalSupply = newToken.totalSupply;
                symbol = newToken.symbol;
                createdDate = Time.now();
            };
            hashMap.put(lastId,token); 
            lastId;
        };

        public func getUserCount(): Nat{
            hashMap.size();
        };

        // public func getUser(userId: UserId): ?Token{
        // };

        // public func getRecordsArray(userId: UserId): [Text]{
        //     var record : ?Profile = hashMap.get(userId);
        //     switch(record) {
        //         case(null) {
        //             return [];
        //         };
        //         case(?record) {
        //             return record.recordWallet;
        //         };
        //     };
        // };

    }
};
