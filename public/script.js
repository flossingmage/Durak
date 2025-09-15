// import express from "express";
// const app = express();
// app.use(express.static('./cards'));

const socket = io();
let currentGame;
let myId;

const message = document.querySelector(".message");
const handDiv = document.querySelector(".hand");


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
});

socket.on("getHand", (sHand) => {
const hand = JSON.parse(sHand)
console.log("your hand is");
console.log(hand)
handDiv.innerHTML = "";
hand.forEach(card => {
  const cardDiv = document.createElement('img')
  cardDiv.src = card.img;
  handDiv.appendChild(cardDiv)
  
});
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
