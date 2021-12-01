export const idlFactory = ({ IDL }) => {
  const NewProfile = IDL.Record({
    'username' : IDL.Text,
    'profileImage' : IDL.Text,
  });
  const UserId = IDL.Principal;
  const Profile = IDL.Record({
    'username' : IDL.Text,
    'userId' : UserId,
    'profileImage' : IDL.Text,
    'createdDate' : IDL.Int,
  });
  const anon_class_10_1 = IDL.Service({
    'checkIfUserLoogedIn' : IDL.Func([], [IDL.Bool], []),
    'createUser' : IDL.Func([NewProfile], [IDL.Principal], []),
    'getUser' : IDL.Func([], [IDL.Opt(Profile)], []),
    'whoAmI' : IDL.Func([], [IDL.Principal], []),
  });
  return anon_class_10_1;
};
export const init = ({ IDL }) => { return []; };
