const socket = io();
let currentGame;
let myId;

socket.on("connect", () => {
  myId = socket.id;
  console.log("Connected to server");
  console.log("My socket ID:", myId);

  socket.emit("joinGame", "Kevin");
});

socket.on("gameJoined", (data) => {
  currentGame = data.gameId;
  console.log(`Joined game: ${currentGame}`);
});

socket.on("waitingForPlayer", (data) => {
  console.log(`Waiting for players to join game: ${data.gameId}`);
});

socket.on("gameReady", (game) => {
  console.log(`Game ${game.id} is ready with players:`, game.players);
  // Here you can update the UI to show the game is ready
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
