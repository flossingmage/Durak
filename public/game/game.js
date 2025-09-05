class Game { 
  
    constructor(id) {
    this.id = id;
    this.deck = [];
    this.players = [];
    this.maxPlayers = 2;
  }  

  createDeck() {
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

    for (let suit of suits) {
      for (let rank of ranks) {
        const card = new Card(suit, rank, `${suit}-${rank}.png`);
        this.deck.push(card);
      }
    }
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  drawCard() {
  return this.deck.pop();
  }

  // Only deal cards at the start of the game
  dealCards() {
    for (let player of this.players) {
      player.hand = [];
      for (let i = 0; i < 6; i++) {
          player.hand.push(this.drawCard());
      }
      console.log(`Dealt cards to player ${player.name}:`, player.hand);
    }
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

  startGame() {
    console.log(`Game ${this.id} is starting with players:`, this.players);
    this.createDeck();
    this.shuffleDeck();
    this.dealCards();
  }
}

class Card {
  constructor(suit, rank, img) {
    this.suit = suit;
    this.rank = rank;
    this.img = img;
  }
}