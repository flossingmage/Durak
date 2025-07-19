let deck: Card[] = [];
let attacks: attack[] = [];
let trumpSuit = "";
let gameOver = false;
let playerHand: Card[] = [];

type Card = { value: number; suit: string; image: string };
type attack = { attack: Card[]; defend: Card[]; defended: boolean };


gameStart();

function gameStart() {
  deck = createDeck();
  trumpSuit = deck[0].suit;
  shuffleDeck();
  console.log(`Trump suit is: ${trumpSuit}`);
  drawCards();
  console.log("Initial player hand:", playerHand);

}

function createDeck() {
  const suits = ["hearts", "diamonds", "clubs", "spades"];
  const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({
        value: value,
        suit: suit,
        image: `${value}_of_${suit}.png`,
      });
    }
  }
  return deck;
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function getCard() {
  return deck.pop();
}

function drawCards() {
    while (playerHand.length < 6){
        const card = getCard();
        if (card !== undefined) {
            playerHand.push(card);
        }else{
            return;
        }
    }
}
