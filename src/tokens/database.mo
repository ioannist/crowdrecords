import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Types "./types";
import Time "mo:base/Time";

module {
    public class Directory() {  

        type NewToken = Types.NewToken;
        type Token = Types.Token;
        type UserId = Types.UserId;
        type TokenMap = Types.TokenMap;
        type TokenType = Types.TokenType;

        //this is the hashmap which will store all the data of all the tokens and the tokens are identified by simple Nat32 number
        let totalTokenHashMap = HashMap.HashMap<Nat32, Token>(1, func (x: Nat32, y: Nat32): Bool { x == y }, func (a : Nat32) : Nat32 {a});
        
        //this stores the list of records that are linked to a particular person.
        let userRecordList = HashMap.HashMap<UserId, [Text]>(1, func (x: UserId, y: UserId): Bool { x == y },Principal.hash);
        
        //this stores the list of tokens that a user owns, it only stores the id of token and it doesn't store the number of tokens that a user owns.
        let userTokenList = HashMap.HashMap<UserId, [Text]>(1, func (x: UserId, y: UserId): Bool { x == y }, Principal.hash);

        //This is the counter of the token id.
        var lastId : Nat32 = 0;    
       
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
            totalTokenHashMap.put(lastId,token); 
            lastId;
        };

      
        /*
        This function accepts recordId as argument and adds the record to the user's recordList
        */
        public func addRecord(userId: UserId,recordId: Text): Bool{
            var record : ?[Text] = userRecordList.get(userId);
            switch(record) {
                case(null) {
                    return false;
                };
                case(?record) {
                    var newRecord : [Text] = Array.append<Text>(record,[recordId]);
                    userRecordList.put(userId,newRecord);
                    return true;
                };
            };
        };

        /*
        This function accepts tokenId as argument and adds the tokenId to the user's TokenList
        */
        public func addToken(userId: UserId,tokenId: Text): Bool{
            var tokenArr : ?[Text] = userTokenList.get(userId);
            switch(tokenArr) {
                case(null) {
                    return false;
                };
                case(?tokenArr) {
                    var newTokenArr : [Text] = Array.append<Text>(tokenArr,[tokenId]);
                    userTokenList.put(userId,newTokenArr);
                    return true;
                };
            };
        };

        /*
        When the user profile is created this function needs to be called so a 
        empty entry is insterted for the user
        */
        public func initializeEmptyValuesForUser(userId: UserId){
            var record : ?[Text] = userRecordList.get(userId);
            switch(record) {
                case(null) {
                    userRecordList.put(userId,[]);
                };
                case(?record) {
                    return;
                };
            };
            var token : ?[Text] = userTokenList.get(userId);
            switch(record) {
                case(null) {
                    userTokenList.put(userId,[]);
                };
                case(?record) {
                    return;
                };
            };
        };

        /*
        This function returns list of records that user owns tokens of
        */
        public func getUserRecordList(userId: UserId): [Text]{
            var record : ?[Text] = userRecordList.get(userId);
            switch(record) {
                case(null) {
                    return [];
                };
                case(?record) {
                    return record;
                };
            };
        };

        /*
        This function returns list of tokens that user owns
        */
        public func getUserTokenList(userId: UserId): [Text]{
            var tokens : ?[Text] = userTokenList.get(userId);
            switch(tokens) {
                case(null) {
                    return [];
                };
                case(?tokens) {
                    return tokens;
                };
            };
        };
   }
}