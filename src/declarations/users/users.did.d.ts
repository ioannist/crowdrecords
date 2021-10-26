import type { Principal } from '@dfinity/principal';
export interface NewProfile { 'username' : string, 'profileImage' : string }
export interface Profile {
  'coinWallet' : Array<string>,
  'username' : string,
  'userId' : UserId,
  'profileImage' : string,
  'createdDate' : bigint,
  'recordWallet' : Array<string>,
}
export type UserId = Principal;
export interface anon_class_9_1 {
  'addRecord' : (arg_0: string) => Promise<boolean>,
  'checkIfUserLoogedIn' : () => Promise<boolean>,
  'createUser' : (arg_0: NewProfile) => Promise<Principal>,
  'getUserProfile' : () => Promise<[] | [Profile]>,
}
export interface _SERVICE extends anon_class_9_1 {}
