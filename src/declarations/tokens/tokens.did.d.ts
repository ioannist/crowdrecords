import type { Principal } from '@dfinity/principal';
export interface NewToken {
  'totalSupply' : bigint,
  'recordId' : string,
  'tokenType' : TokenType,
  'symbol' : string,
}
export type TokenType = { 'governance' : null } |
  { 'copyright' : null };
export interface anon_class_9_1 {
  'createNewToken' : (arg_0: NewToken) => Promise<number>,
}
export interface _SERVICE extends anon_class_9_1 {}
