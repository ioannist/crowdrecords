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
  const anon_class_9_1 = IDL.Service({
    'createNewToken' : IDL.Func([NewToken], [IDL.Nat32], []),
  });
  return anon_class_9_1;
};
export const init = ({ IDL }) => { return []; };
