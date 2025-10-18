const socket = io();

let currentGame;
let myId;

const Hand = new Map();

let message;
let handDiv;
let attatckDiv;

// Wait for the DOM to load before querying elements
document.addEventListener("DOMContentLoaded", () => {
  message = document.querySelector(".message");
  handDiv = document.querySelector(".hand");
  attatckDiv = document.querySelector(".attack");
});

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
  const hand = JSON.parse(sHand);
  console.log("your hand is");
  console.log(hand);
  handDiv.innerHTML = "";
  hand.forEach((card) => {
    const cardDiv = createCardElement(card);
    cardDiv.addEventListener("click", (e) => playCard(e));
    handDiv.appendChild(cardDiv);

    Hand.set(cardDiv, card);
  });
});


// need to add more functionality to attack card.
socket.on("cardPlayed", (card) => {
  console.log("Card played:", card);
  message.textContent = `Card played: ${card.rank} of ${card.suit}`;
  const cardDiv = createCardElement(card);
 // cardDiv.addEventListener("click", (e) => playCard(e));
  attatckDiv.appendChild(cardDiv);
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

// send a card off to the server
// Needs to get uppdated
function playCard(card) {
  console.log("play card clicked");

  socket.emit("playCard", Hand.get(card.target));
  Hand.delete(card.target);
  card.target.remove();
}

// create a card element and return it
function createCardElement(card) {
  const cardDiv = document.createElement("img");
  cardDiv.src = card.img;
  cardDiv.width = 121;
  cardDiv.height = 170;
  cardDiv.className = "card";
  return cardDiv;
}
