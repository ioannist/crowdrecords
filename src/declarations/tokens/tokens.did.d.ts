import type { Principal } from '@dfinity/principal';
export interface NewToken {
  'totalSupply' : bigint,
  'recordId' : RecordId,
  'tokenType' : TokenType,
  'symbol' : string,
}
export type RecordId = number;
export type RecordId__1 = number;
export type TokenId = number;
export type TokenType = { 'governance' : null } |
  { 'copyright' : null };
export type UserId = Principal;
export interface _SERVICE {
  'addRecord' : (arg_0: RecordId__1) => Promise<boolean>,
  'createNewTokens' : (
      arg_0: UserId,
      arg_1: NewToken,
      arg_2: NewToken,
    ) => Promise<[TokenId, TokenId]>,
  'initializeEmptyValuesForUser' : (arg_0: UserId) => Promise<undefined>,
}
