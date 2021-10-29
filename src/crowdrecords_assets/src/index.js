import { users, createActor } from "../../declarations/users";
import { AuthClient } from "@dfinity/auth-client";

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

const init = async () => {
  document.getElementById("profileSection").style.display = true;
  const authClient = await AuthClient.create();
  if (await authClient.isAuthenticated()) {
    handleAuthenticated(authClient);
  }

  const loginButton = document.getElementById("loginButton");

  const days = BigInt(1);
  const hours = BigInt(24);
  const nanoseconds = BigInt(3600000000000);

  loginButton.onclick = async () => {
    await authClient.login({
      onSuccess: async () => {
        handleAuthenticated(authClient);
      },
      identityProvider: "http://localhost:7000/?canisterId=rwlgt-iiaaa-aaaaa-aaaaa-cai",
      // Maximum authorization expiration is 8 days
      maxTimeToLive: days * hours * nanoseconds,
    });
  };

  document.getElementById("logout").onclick = async () => {
    await authClient.logout();
  };
};

async function handleAuthenticated(authClient) {
  const identity = await authClient.getIdentity();
  const authanticatedUser = createActor(CAN, {
    agentOptions: {
      identity,
    },
  });
  profileData(authanticatedUser);
}

function profileData(authanticatedUser) {
  document.getElementById("profileSection").style.display = false;
  let profileSection = document.getElementById("profileSection");
  profileSection.removeAttribute("hidden");
  document.getElementById("userPrincipal").value = authanticatedUser.whoAmI().toString();
}

init();
