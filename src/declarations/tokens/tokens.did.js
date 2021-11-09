export const idlFactory = ({ IDL }) => {
  const RecordId__1 = IDL.Nat32;
  const UserId = IDL.Principal;
  const RecordId = IDL.Nat32;
  const TokenType = IDL.Variant({
    'governance' : IDL.Null,
    'copyright' : IDL.Null,
  });
  const NewToken = IDL.Record({
    'totalSupply' : IDL.Nat,
    'recordId' : RecordId,
    'tokenType' : TokenType,
    'symbol' : IDL.Text,
  });
  const TokenId = IDL.Nat32;
  return IDL.Service({
    'addRecord' : IDL.Func([RecordId__1], [IDL.Bool], []),
    'createNewTokens' : IDL.Func(
        [UserId, NewToken, NewToken],
        [TokenId, TokenId],
        [],
      ),
    'initializeEmptyValuesForUser' : IDL.Func([UserId], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
