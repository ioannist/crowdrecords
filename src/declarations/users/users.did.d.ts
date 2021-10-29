import type { Principal } from '@dfinity/principal';
export interface NewProfile { 'username' : string, 'profileImage' : string }
export interface Profile {
  'username' : string,
  'userId' : UserId,
  'profileImage' : string,
  'createdDate' : bigint,
}
export type UserId = Principal;
export interface anon_class_10_1 {
  'checkIfUserLoogedIn' : () => Promise<boolean>,
  'createUser' : (arg_0: NewProfile) => Promise<Principal>,
  'getUserProfile' : () => Promise<[] | [Profile]>,
  'whoAmI' : () => Promise<Principal>,
}
export interface _SERVICE extends anon_class_10_1 {}
