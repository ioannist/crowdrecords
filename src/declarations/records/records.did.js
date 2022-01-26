export const idlFactory = ({ IDL }) => {
  const RecordCategoryId = IDL.Nat32;
  const TrackId = IDL.Nat32;
  const ContributionId = IDL.Nat32;
  const NewRecords = IDL.Record({
    'recordCategory' : RecordCategoryId,
    'peerVersion' : IDL.Nat32,
    'tracks' : IDL.Vec(TrackId),
    'name' : IDL.Text,
    'seedId' : ContributionId,
    'previewFile' : IDL.Text,
  });
  const Reward = IDL.Record({
    'governanceToken' : IDL.Nat32,
    'communityToken' : IDL.Nat32,
    'icpToken' : IDL.Nat32,
  });
  const RecordId__1 = IDL.Nat32;
  const NewContribution = IDL.Record({
    'reward' : Reward,
    'description' : IDL.Text,
    'tracksId' : IDL.Vec(TrackId),
    'recordId' : RecordId__1,
    'mixFile' : IDL.Text,
  });
  const NewTokenData = IDL.Record({
    'createrTokens' : IDL.Nat,
    'totalSupply' : IDL.Nat,
    'treasuryTokens' : IDL.Nat,
    'symbol' : IDL.Text,
  });
  const RecordId = IDL.Nat32;
  const VotingId = IDL.Nat32;
  const UserId = IDL.Principal;
  const VotingId__1 = IDL.Nat32;
  const FROZEN_Voting = IDL.Record({
    'negativeVotes' : IDL.Vec(UserId),
    'positiveVotes' : IDL.Vec(UserId),
    'votingId' : VotingId__1,
    'resultTime' : IDL.Int,
  });
  return IDL.Service({
    'contractVotingCron' : IDL.Func([], [], ['oneway']),
    'contributionVotingCron' : IDL.Func([], [], ['oneway']),
    'createRecord' : IDL.Func(
        [NewRecords, NewContribution, NewTokenData, NewTokenData],
        [RecordId],
        [],
      ),
    'getRecord' : IDL.Func([RecordId], [], ['oneway']),
    'proposeContract' : IDL.Func([RecordId], [], ['oneway']),
    'royaltyDistributionCron' : IDL.Func([], [], ['oneway']),
    'voteForContract' : IDL.Func([], [], ['oneway']),
    'voteForContribution' : IDL.Func(
        [VotingId, IDL.Bool],
        [IDL.Opt(FROZEN_Voting)],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
