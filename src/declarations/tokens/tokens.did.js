export const idlFactory = ({ IDL }) => {
  const TokenType = IDL.Variant({
    'governance' : IDL.Null,
    'copyright' : IDL.Null,
  });
  const NewToken = IDL.Record({
    'totalSupply' : IDL.Nat,
    'recordId' : IDL.Text,
    'tokenType' : TokenType,
    'symbol' : IDL.Text,
  });
  const UserId = IDL.Principal;
  return IDL.Service({
    'addRecord' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'createNewToken' : IDL.Func([NewToken], [IDL.Nat32], []),
    'initializeEmptyValuesForUser' : IDL.Func([UserId], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
