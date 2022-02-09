export const idlFactory = ({ IDL }) => {
  const RecordId = IDL.Nat32;
  const UserId = IDL.Principal;
  const RecordId__1 = IDL.Nat32;
  const TokenType = IDL.Variant({
    'governance' : IDL.Null,
    'copyright' : IDL.Null,
  });
  const NewToken = IDL.Record({
    'createrTokens' : IDL.Nat,
    'totalSupply' : IDL.Nat,
    'recordId' : RecordId__1,
    'tokenType' : TokenType,
    'treasuryTokens' : IDL.Nat,
    'symbol' : IDL.Text,
  });
  const TreasuryId__1 = IDL.Nat32;
  const TokenId__1 = IDL.Nat32;
  const Token = IDL.Record({
    'id' : TokenId__1,
    'createdDate' : IDL.Int,
    'totalSupply' : IDL.Nat,
    'recordId' : RecordId__1,
    'tokenType' : TokenType,
    'symbol' : IDL.Text,
  });
  const TreasuryId = IDL.Nat32;
  const TreasuryFrozenData = IDL.Record({
    'id' : TreasuryId,
    'governanceToken' : TokenId__1,
    'copyrightToken' : TokenId__1,
    'createdDate' : IDL.Int,
    'copyrightHolding' : IDL.Nat,
    'recordId' : RecordId__1,
    'governanceHolding' : IDL.Nat,
  });
  const TokenId = IDL.Nat32;
  return IDL.Service({
    'addRecord' : IDL.Func([RecordId], [IDL.Bool], []),
    'addRecordToUserAccount' : IDL.Func([RecordId], [], ['oneway']),
    'createTokenOffer' : IDL.Func([IDL.Nat, IDL.Nat], [], ['oneway']),
    'createTokens' : IDL.Func(
        [UserId, NewToken, NewToken],
        [TreasuryId__1],
        [],
      ),
    'getAllTokens' : IDL.Func([], [IDL.Vec(Token)], []),
    'getAllTreasury' : IDL.Func([], [IDL.Vec(TreasuryFrozenData)], ['query']),
    'getRecordICPAccount' : IDL.Func([RecordId], [], ['oneway']),
    'getTokenOffer' : IDL.Func([IDL.Nat, IDL.Nat], [], ['oneway']),
    'getTransferHistory' : IDL.Func([], [], ['oneway']),
    'getUserRecordList' : IDL.Func([UserId], [IDL.Vec(RecordId)], []),
    'getUserTokenList' : IDL.Func([UserId], [IDL.Vec(TokenId)], []),
    'initializeEmptyValuesForUser' : IDL.Func([UserId], [], []),
    'tokenMinting' : IDL.Func([UserId, IDL.Nat], [], ['oneway']),
    'transferContributionReward' : IDL.Func([], [], ['oneway']),
    'transferTokens' : IDL.Func([UserId], [], ['oneway']),
  });
};
export const init = ({ IDL }) => { return []; };
