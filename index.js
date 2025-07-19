const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, "public")));

class Game {
  constructor(id) {
    this.id = id;
    this.deck = [];
    this.players = [];
    this.maxPlayers = 2;
  }

  playerJoin(socket, playerName) {
    if (this.players.length < this.maxPlayers) {
      const player = {
        socket: socket,
        name: playerName,
        hand: [],
        id: this.players.length + 1,
      };
      this.players.push(player);
      console.log(`Player ${playerName} joined game ${this.id}`);
      return player;
    }
    return null;
  }
}

class Card {
  constructor(suit, rank, img) {
    this.suit = suit;
    this.rank = rank;
    this.img = img;
  }
}

let games = new Map();
let waitingPlayers = [];

io.on("connection", (socket) => {
  socket.on("joinGame", (playerName) => {
    let game;

    // Check if there's an existing game with space for more players
    for (let gId of games.keys()) {
      const g = games.get(gId);
      if (g.players.length < g.maxPlayers) {
        game = g;
        break;
      }
    }

    // If no game found, create a new one
    if (!game) {
      const gameId = `game-${Date.now().toString(36) + Math.random().toString(36).substring(2, 15)}`;
      game = new Game(gameId);
      games.set(gameId, game);
    }

    const player = game.playerJoin(socket, playerName);

    if (player) {
      socket.join(game.id);

      const playerData = {
        playerName: player.name,
        playerId: player.id,
        hand: player.hand,
      };

      socket.emit("gameJoined", {
        gameId: game.id,
        playerName: player.name,
        playerData: playerData,
      });

      console.log(
        `Player ${player.name} joined game ${game.id} game had ${game.players.length} players.`
      );
    }

    if (game.players.length === game.maxPlayers) {
      const gameData = {
        id: game.id,
        players: game.players.map((p) => ({
          id: p.id,
          name: p.name,
          hand: p.hand,
        })),
        maxPlayers: game.maxPlayers,
      };

      io.to(game.id).emit("gameReady", gameData);
    } else {
      socket.emit("waitingForPlayer", { gameId: game.id });
    }
  });
});

io.on("disconnect", (socket) => {
  console.log(`Socket ${socket.id} disconnected`);
  // Handle player disconnection logic here if needed
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});

module.exports = app;
