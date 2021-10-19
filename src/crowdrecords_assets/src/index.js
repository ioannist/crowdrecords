import { crowdrecords } from "../../declarations/crowdrecords";

document.getElementById("clickMeBtn").addEventListener("click", async () => {
  const name = document.getElementById("name").value.toString();
  // Interact with crowdrecords actor, calling the greet method
  const greeting = await crowdrecords.greet(name);

  document.getElementById("greeting").innerText = greeting;
});
