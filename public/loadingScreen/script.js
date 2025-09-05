const socket = io();
let currentGame;
let myId;

const message = document.querySelector(".message");

socket.on("connect", () => {
  myId = socket.id;
  message.textContent = "Connected to the server";
  console.log("Connected to server");
  console.log("My socket ID:", myId);

  socket.emit("joinGame", "Kevin");
});

socket.on("gameJoined", (data) => {
  currentGame = data.gameId;
  console.log(`Joined game: ${currentGame}`);
});

socket.on("waitingForPlayer", (data) => {
  message.textContent = `Waiting for players to join game: ${data.gameId}`;
  console.log(`Waiting for players to join game: ${data.gameId}`);
});

socket.on("gameReady", (game) => {
  message.textContent = `game is about to start with ${game.players.length} players.`;
  console.log(`Game ${game.id} is ready with players:`, game.players);
  // Here you can update the UI to show the game is ready
});

socket.on("hand", (sHand) => {
const hand = JSON.parse(sHand)
console.log("your hand is");
console.log(hand)
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
