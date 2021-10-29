import Principal "mo:base/Principal";
import Array "mo:base/Array";

module {
  public type UserId = Principal;

   public type Profile = {
        userId:UserId;
        username: Text;
        profileImage: Text;
        createdDate: Int; 
    };

    public type NewProfile = {
        username: Text;
        profileImage: Text;
    };
};
