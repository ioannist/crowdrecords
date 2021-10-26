import Principal "mo:base/Principal";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";

module {
    public type UserId = Principal;
    public type TokenMap = HashMap.HashMap<UserId,Nat>;

    public type TokenType = {
        #governance;#copyright 
    };

    public type Token = {
        id: Nat32;
        recordId: Text;
        tokenType: TokenType;
        tokenMap: TokenMap;
        symbol: Text;
        totalSupply: Nat;
        createdDate: Int; 
    };

    public type NewToken = {
        recordId: Text;
        tokenType: TokenType;
        symbol: Text;
        totalSupply: Nat;
    };
};
