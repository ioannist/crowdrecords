import { users, createActor, canisterId } from "../../declarations/users";
import { records } from "../../declarations/records";
import { AuthClient } from "@dfinity/auth-client";
import { IDENTITY_PROVIDER_PATH } from "./config";

const createRecord = async () => {
    console.log("creating record");
    await records
        .createRecord(
            {
                name: "New Record",
                tracks: [1, 2],
                peerVersion: 0,
                seedId: 1,
                recordCategory: 0,
                previewFile: "Some file url",
            },
            {
                tracksId: [1, 2],
                recordId: 0,
                mixFile: "somelink",
                description: "Some Text . . . .",
                reward: {
                    communityToken: 10,
                    governanceToken: 10,
                    icpToken: 0,
                },
            },
            {
                symbol: "NEW REC 1",
                totalSupply: 10000,
                createrTokens: 5000,
                treasuryTokens: 5000,
            },
            {
                symbol: "NEW REC 2",
                totalSupply: 10000,
                createrTokens: 5000,
                treasuryTokens: 5000,
            }
        )
        .then((res) => {
            console.log(res);
        })
        .catch((err) => {
            console.log(err);
        });
};

document.getElementById("createActualUserButton").addEventListener("click", async () => {
    const username = document.getElementById("username").value.toString();
    const profileImage = document.getElementById("profileUrl").value.toString();
    // Interact with users actor, calling the greet method
    const createUser = await users.createUser({ username, profileImage });

    document.getElementById("createUserResult").innerText = createUser;
});

document.getElementById("getUserButton").addEventListener("click", async () => {
    // const userId = document.getElementById("userId").value.toString();
    const user = await users.getUser();
    console.log("Createuser = ", user);
    console.log("User ID ", user[0].userId.toString());
    document.getElementById("getUserResult").innerText = "Check console";
});

const init = async () => {
    document.getElementById("profileSection").setAttribute("hidden", "hidden");
    const authClient = await AuthClient.create();
    if (await authClient.isAuthenticated()) {
        console.log("initial authentication passes");
        handleAuthenticated(authClient);
    }

    const loginButton = document.getElementById("loginButton");
    const loginDiv = document.getElementById("loginDiv");
    loginDiv.removeAttribute("hidden");

    const days = BigInt(1);
    const hours = BigInt(24);
    const nanoseconds = BigInt(3600000000000);

    loginButton.onclick = async () => {
        await authClient.login({
            onSuccess: async () => {
                handleAuthenticated(authClient);
            },
            //Below is the identity provider path change it
            identityProvider: IDENTITY_PROVIDER_PATH,
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
    console.log("Identity = ", identity);
    const authanticatedUser = createActor(canisterId, {
        agentOptions: {
            identity,
        },
    });
    profileData(authanticatedUser);
}

async function profileData(authanticatedUser) {
    let profileSection = document.getElementById("profileSection");
    profileSection.removeAttribute("hidden");
    (async function () {
        const principal = await authanticatedUser.whoAmI();
        console.log("Principal Object = ", principal);
        document.getElementById("userPrincipal").value = principal.toString();
    })();
    let loginDiv = document.getElementById("loginDiv");
    loginDiv.setAttribute("hidden", "hidden");
}

init();
createRecord();
