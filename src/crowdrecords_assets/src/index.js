import { crowdrecords } from "../../declarations/crowdrecords";

// document.getElementById("clickMeBtn").addEventListener("click", async () => {
//   const username = document.getElementById("username").value.toString();
//   const profileImage = document.getElementById("profileUrl").value.toString();
//   // Interact with crowdrecords actor, calling the greet method
//   const createUserTemp = await crowdrecords.createUserTemp({ username, profileImage });

//   document.getElementById("createUserTemp").innerText = createUserTemp;
// });

document.getElementById("createActualUserButton").addEventListener("click", async () => {
  const username = document.getElementById("username").value.toString();
  const profileImage = document.getElementById("profileUrl").value.toString();
  // Interact with crowdrecords actor, calling the greet method
  const createUser = await crowdrecords.createUser({ username, profileImage });

  document.getElementById("createUserResult").innerText = createUser;
});

document.getElementById("getUserButton").addEventListener("click", async () => {
  // const userId = document.getElementById("userId").value.toString();
  const user = await crowdrecords.getUserProfile();
  console.log("Createuser = ", user);
  console.log("User ID ", user[0].userId.toString());
  document.getElementById("getUserResult").innerText = "Check console";
});
