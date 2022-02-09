import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Types "./types";
import Time "mo:base/Time";
import P "mo:⛔";

module {
    public class Directory() {  

        type NewToken = Types.NewToken;
        type Token = Types.Token;
        type UserId = Types.UserId;
        type TokenMap = Types.TokenMap;
        type TokenType = Types.TokenType;
        type RecordId = Types.RecordId;
        type TokenId = Types.TokenId;
        type TreasuryId = Types.TreasuryId;
        type Treasury = Types.Treasury;
        type TreasuryFrozenData = Types.TreasuryFrozenData;

        //this is the hashmap which will store all the data of all the tokens and the tokens are identified by simple Nat32 number
        let totalTokenHashMap = HashMap.HashMap<Nat32, Token>(1, func (x: Nat32, y: Nat32): Bool { x == y }, func (a : Nat32) : Nat32 {a});

        //this is the hashmap which will store all the data of all the tokens and the tokens are identified by simple Nat32 number
        let totalTreasuryHashMap = HashMap.HashMap<Nat32, Treasury>(1, func (x: Nat32, y: Nat32): Bool { x == y }, func (a : Nat32) : Nat32 {a});

        //this stores the list of records that are linked to a particular person.
        let userRecordList = HashMap.HashMap<UserId, [RecordId]>(1, func (x: UserId, y: UserId): Bool { x == y },Principal.hash);
        
        //this stores the list of tokens that a user owns, it only stores the id of token and it doesn't store the number of tokens that a user owns.
        let userTokenList = HashMap.HashMap<UserId, [TokenId]>(1, func (x: UserId, y: UserId): Bool { x == y }, Principal.hash);

        //This is the counter of the token id.
        var lastId : TokenId = 0;    

        var treasuryId : TreasuryId = 0;

        public func createTokens(userId: UserId,newToken: NewToken): TokenId{
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

        //This function creates treasury and related tokens and stores them in the mapping
        public func createTreasury(userId: UserId,copyrightToken: NewToken,governanceToken: NewToken): TreasuryId{
            lastId += 1;    
            let copyId : TokenId = lastId;    
            lastId += 1;    
            let governanceId : TokenId = lastId;    
            
            let copyToken : Token = {
                id = copyId;
                recordId = copyrightToken.recordId;
                tokenType = copyrightToken.tokenType;
                symbol = copyrightToken.symbol;
                totalSupply = copyrightToken.totalSupply;
                createdDate = Time.now();
            };
            totalTokenHashMap.put(copyId,copyToken); 

            let govToken : Token = {
                id = governanceId;
                recordId = governanceToken.recordId;
                tokenType = governanceToken.tokenType;
                symbol = governanceToken.symbol;
                totalSupply = governanceToken.totalSupply;
                createdDate = Time.now();
            };
            totalTokenHashMap.put(governanceId,govToken); 
            
            //This is for treasury
            let copyTokenMap : TokenMap = HashMap.HashMap<UserId,Nat>(1, func (x: UserId, y: UserId): Bool { x == y }, Principal.hash);
            copyTokenMap.put(userId,copyrightToken.createrTokens);

             //This is for treasury
            let govTokenMap : TokenMap = HashMap.HashMap<UserId,Nat>(1, func (x: UserId, y: UserId): Bool { x == y }, Principal.hash);
            govTokenMap.put(userId,governanceToken.createrTokens);
            
            treasuryId += 1;

            let treasury : Treasury = {
                id = treasuryId;
                recordId = copyrightToken.recordId;
                copyrightToken = copyId;
                governanceToken = governanceId;
                copyrightMapping = copyTokenMap;
                governanceMapping = govTokenMap;
                copyrightHolding = copyrightToken.treasuryTokens; // Count of amount of tokens the treasury has
                governanceHolding = governanceToken.treasuryTokens; // Count of amount of tokens the treasury has
                createdDate = Time.now();
            };
            totalTreasuryHashMap.put(treasuryId,treasury);

            return treasuryId;
        };

        //! TEST : This function is for testing purpose to get all the treasury
        public func getAllTreasury(): ([TreasuryFrozenData]){
            
            var treasuryList : [TreasuryFrozenData] = [];

            //Transfer the tracks from the temp into the alltrackslist
            for(key in totalTreasuryHashMap.keys()){
                let treasuryData : ?Treasury = totalTreasuryHashMap.get(key);
                switch(treasuryData){
                    case (null){
                        var a : Nat32 = 0;
                    };
                    case (?treasuryData){
                        treasuryList := Array.append<TreasuryFrozenData>(treasuryList,[{
                            id = treasuryData.id;
                            recordId = treasuryData.recordId;
                            copyrightToken = treasuryData.copyrightToken;
                            governanceToken = treasuryData.governanceToken;
                            copyrightHolding = treasuryData.copyrightHolding;
                            governanceHolding = treasuryData.governanceHolding;
                            createdDate = treasuryData.createdDate;
                        }]);
                    };
                }
            };
            P.debugPrint(debug_show("Text",treasuryList));
            return treasuryList;
        };

        //! TEST : This function is for testing purpose to get all the Tokens
        public func getAllTokens(): async ([Token]){
            
            var tokenList : [Token] = [];
            var count : Nat = 0;
            //Transfer the tracks from the temp into the alltrackslist
            for(key in totalTokenHashMap.keys()){
                let tokenData : ?Token = totalTokenHashMap.get(key);
                switch(tokenData){
                    case (null){
                        var a : Nat32 = 0;
                    };
                    case (?tokenData){
                        count := count + 1; 
                        tokenList := Array.append<Token>(tokenList,[tokenData]);
                    };
                }
            };

            return tokenList;
        };

      
        /*
        This function accepts recordId as argument and adds the record to the user's recordList
        */
        public func addRecord(userId: UserId,recordId: RecordId): Bool{
            var record : ?[RecordId] = userRecordList.get(userId);
            switch(record) {
                case(null) {
                    return false;
                };
                case(?record) {
                    var newRecord : [RecordId] = Array.append<RecordId>(record,[recordId]);
                    userRecordList.put(userId,newRecord);
                    return true;
                };
            };
        };

        /*
        This function accepts tokenId as argument and adds the tokenId to the user's TokenList
        */
        public func addToken(userId: UserId,tokenId: TokenId): Bool{
            var tokenArr : ?[TokenId] = userTokenList.get(userId);
            switch(tokenArr) {
                case(null) {
                    return false;
                };
                case(?tokenArr) {
                    var newTokenArr : [TokenId] = Array.append<TokenId>(tokenArr,[tokenId]);
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
            var record : ?[RecordId] = userRecordList.get(userId);
            switch(record) {
                case(null) {
                    userRecordList.put(userId,[]);
                };
                case(?record) {
                    return;
                };
            };
            var token : ?[TokenId] = userTokenList.get(userId);
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
        public func getUserRecordList(userId: UserId): [RecordId]{
            var record : ?[RecordId] = userRecordList.get(userId);
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
        public func getUserTokenList(userId: UserId): [TokenId]{
            var tokens : ?[TokenId] = userTokenList.get(userId);
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