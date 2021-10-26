export const idlFactory = ({ IDL }) => {
  const NewProfile = IDL.Record({
    'username' : IDL.Text,
    'profileImage' : IDL.Text,
  });
  const UserId = IDL.Principal;
  const Profile = IDL.Record({
    'coinWallet' : IDL.Vec(IDL.Text),
    'username' : IDL.Text,
    'userId' : UserId,
    'profileImage' : IDL.Text,
    'createdDate' : IDL.Int,
    'recordWallet' : IDL.Vec(IDL.Text),
  });
  const anon_class_9_1 = IDL.Service({
    'addRecord' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'checkIfUserLoogedIn' : IDL.Func([], [IDL.Bool], []),
    'createUser' : IDL.Func([NewProfile], [IDL.Principal], []),
    'getUserProfile' : IDL.Func([], [IDL.Opt(Profile)], []),
  });
  return anon_class_9_1;
};
export const init = ({ IDL }) => { return []; };
