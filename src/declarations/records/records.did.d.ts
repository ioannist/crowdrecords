import type { Principal } from '@dfinity/principal';
export type ContributionId = number;
export interface FROZEN_Voting {
  'negativeVotes' : Array<UserId>,
  'positiveVotes' : Array<UserId>,
  'votingId' : VotingId__1,
  'resultTime' : bigint,
}
export interface NewContribution {
  'reward' : Reward,
  'description' : string,
  'tracksId' : Array<TrackId>,
  'recordId' : RecordId__1,
  'mixFile' : string,
}
export interface NewRecords {
  'recordCategory' : RecordCategoryId,
  'peerVersion' : number,
  'tracks' : Array<TrackId>,
  'name' : string,
  'seedId' : ContributionId,
  'previewFile' : string,
}
export interface NewTokenData {
  'createrTokens' : bigint,
  'totalSupply' : bigint,
  'treasuryTokens' : bigint,
  'symbol' : string,
}
export type RecordCategoryId = number;
export type RecordId = number;
export type RecordId__1 = number;
export interface Reward {
  'governanceToken' : number,
  'communityToken' : number,
  'icpToken' : number,
}
export type TrackId = number;
export type UserId = Principal;
export type VotingId = number;
export type VotingId__1 = number;
export interface _SERVICE {
  'contractVotingCron' : () => Promise<undefined>,
  'contributionVotingCron' : () => Promise<undefined>,
  'createRecord' : (
      arg_0: NewRecords,
      arg_1: NewContribution,
      arg_2: NewTokenData,
      arg_3: NewTokenData,
    ) => Promise<RecordId>,
  'getRecord' : (arg_0: RecordId) => Promise<undefined>,
  'proposeContract' : (arg_0: RecordId) => Promise<undefined>,
  'royaltyDistributionCron' : () => Promise<undefined>,
  'voteForContract' : () => Promise<undefined>,
  'voteForContribution' : (arg_0: VotingId, arg_1: boolean) => Promise<
      [] | [FROZEN_Voting]
    >,
}
