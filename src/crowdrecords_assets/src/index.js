import { users } from "../../declarations/users";

// document.getElementById("clickMeBtn").addEventListener("click", async () => {
//   const username = document.getElementById("username").value.toString();
//   const profileImage = document.getElementById("profileUrl").value.toString();
//   // Interact with users actor, calling the greet method
//   const createUserTemp = await users.createUserTemp({ username, profileImage });

//   document.getElementById("createUserTemp").innerText = createUserTemp;
// });

document.getElementById("createActualUserButton").addEventListener("click", async () => {
  const username = document.getElementById("username").value.toString();
  const profileImage = document.getElementById("profileUrl").value.toString();
  // Interact with users actor, calling the greet method
  const createUser = await users.createUser({ username, profileImage });

  document.getElementById("createUserResult").innerText = createUser;
});

document.getElementById("getUserButton").addEventListener("click", async () => {
  // const userId = document.getElementById("userId").value.toString();
  const user = await users.getUserProfile();
  console.log("Createuser = ", user);
  console.log("User ID ", user[0].userId.toString());
  document.getElementById("getUserResult").innerText = "Check console";
});
