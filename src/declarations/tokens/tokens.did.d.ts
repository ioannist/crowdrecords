import type { Principal } from '@dfinity/principal';
export interface NewToken {
  'createrTokens' : bigint,
  'totalSupply' : bigint,
  'recordId' : RecordId__1,
  'tokenType' : TokenType,
  'treasuryTokens' : bigint,
  'symbol' : string,
}
export type RecordId = number;
export type RecordId__1 = number;
export interface Token {
  'id' : TokenId__1,
  'createdDate' : bigint,
  'totalSupply' : bigint,
  'recordId' : RecordId__1,
  'tokenType' : TokenType,
  'symbol' : string,
}
export type TokenId = number;
export type TokenId__1 = number;
export type TokenType = { 'governance' : null } |
  { 'copyright' : null };
export interface TreasuryFrozenData {
  'id' : TreasuryId,
  'governanceToken' : TokenId__1,
  'copyrightToken' : TokenId__1,
  'createdDate' : bigint,
  'copyrightHolding' : bigint,
  'recordId' : RecordId__1,
  'governanceHolding' : bigint,
}
export type TreasuryId = number;
export type TreasuryId__1 = number;
export type UserId = Principal;
export interface _SERVICE {
  'addRecord' : (arg_0: RecordId) => Promise<boolean>,
  'addRecordToUserAccount' : (arg_0: RecordId) => Promise<undefined>,
  'createTokenOffer' : (arg_0: bigint, arg_1: bigint) => Promise<undefined>,
  'createTokens' : (arg_0: UserId, arg_1: NewToken, arg_2: NewToken) => Promise<
      TreasuryId__1
    >,
  'getAllTokens' : () => Promise<Array<Token>>,
  'getAllTreasury' : () => Promise<Array<TreasuryFrozenData>>,
  'getRecordICPAccount' : (arg_0: RecordId) => Promise<undefined>,
  'getTokenOffer' : (arg_0: bigint, arg_1: bigint) => Promise<undefined>,
  'getTransferHistory' : () => Promise<undefined>,
  'getUserRecordList' : (arg_0: UserId) => Promise<Array<RecordId>>,
  'getUserTokenList' : (arg_0: UserId) => Promise<Array<TokenId>>,
  'initializeEmptyValuesForUser' : (arg_0: UserId) => Promise<undefined>,
  'tokenMinting' : (arg_0: UserId, arg_1: bigint) => Promise<undefined>,
  'transferContributionReward' : () => Promise<undefined>,
  'transferTokens' : (arg_0: UserId) => Promise<undefined>,
}
