import Principal "mo:base/Principal";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";

module {
    public type UserId = Principal;
    public type TokenMap = HashMap.HashMap<UserId,Nat>;
    public type RecordId = Nat32;
    public type TokenId = Nat32;
    public type TreasuryId = Nat32;

    public type TokenType = {
        #governance;#copyright 
    };

    public type Token = {
        id: TokenId;
        recordId: RecordId;
        tokenType: TokenType;
        // tokenMap: TokenMap; // Removing the token map from token and shifting it to the treasury
        symbol: Text;
        totalSupply: Nat;
        createdDate: Int; 
    };

    public type NewToken = {
        recordId: RecordId;
        tokenType: TokenType;
        symbol: Text;
        totalSupply: Nat;
        createrTokens:Nat;
        treasuryTokens:Nat;
    };

    public type Treasury = {
        id: TreasuryId;
        recordId: RecordId;
        copyrightToken: TokenId;
        governanceToken: TokenId;
        copyrightMapping: TokenMap;
        governanceMapping: TokenMap;
        copyrightHolding: Nat;
        governanceHolding: Nat;
        createdDate: Int;
    };

};