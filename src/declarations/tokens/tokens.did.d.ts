import type { Principal } from '@dfinity/principal';
export interface NewToken {
  'totalSupply' : bigint,
  'recordId' : string,
  'tokenType' : TokenType,
  'symbol' : string,
}
export type TokenType = { 'governance' : null } |
  { 'copyright' : null };
export type UserId = Principal;
export interface _SERVICE {
  'addRecord' : (arg_0: string) => Promise<boolean>,
  'createNewToken' : (arg_0: NewToken) => Promise<number>,
  'initializeEmptyValuesForUser' : (arg_0: UserId) => Promise<undefined>,
}
