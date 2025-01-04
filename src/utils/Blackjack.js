/** @enum {string} */
const Decks = Object.freeze({
    PLAYER: "player",
    DEALER: "dealer",
});

class Blackjack {
    constructor() {
        this.deck = this.generateDeck();
        /** @type {Array<{suit: string, rank: number | string}>} */
        this.playerDeck = [];
        /** @type {Array<{suit: string, rank: number | string}>} */
        this.dealerDeck = [];
    }

    get playerValue() {
        return this.deckValue(this.playerDeck);
    }

    get dealerValue() {
        return this.deckValue(this.dealerDeck);
    }

    generateDeck() {
        const suits = ["♣️", "♦️", "♥️", "♠️"];
        const faces = ["J", "K", "Q", "A"];
        const deck = [];

        for (const suit of suits) {
            let value = 2;
            for (let i = 0; i < 9; i++) {
                deck.push({
                    suit,
                    rank: value,
                });
                value++;
            }
            for (const face of faces) {
                deck.push({
                    suit,
                    rank: face,
                });
            }
        }

        return deck;
    }

    shuffle() {
        let currentIndex = this.deck.length;

        // While there remain elements to shuffle...
        while (currentIndex != 0) {
            // Pick a remaining element...
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [this.deck[currentIndex], this.deck[randomIndex]] = [
                this.deck[randomIndex],
                this.deck[currentIndex],
            ];
        }
    }

    start() {
        this.deal(Decks.PLAYER, 2);
        this.deal(Decks.DEALER, 2);
    }

    /** @param {Decks} deck @param {Number} amount  */
    deal(deck, amount) {
        if (deck === "player") {
            this.playerDeck.push(...this.deck.splice(0, amount));
        } else {
            this.dealerDeck.push(...this.deck.splice(0, amount));
        }
    }

    /** @param {Array<{suit: string, rank: number | string}>} deck */
    deckValue(deck) {
        const faceValues = {
            J: 10,
            K: 10,
            Q: 10,
            A: 11,
        };

        // deck === "player" ? (deck = this.playerDeck) : (deck = this.dealerDeck);

        let value = 0;
        let numAces = 0;

        for (const card of deck) {
            if (card.rank === "A") numAces += 1;

            if (typeof card.rank === "string") {
                value += faceValues[card.rank];
            } else {
                value += card.rank;
            }
        }

        // Thanks random website for this insanely complicated algorithm
        while (numAces > 0) {
            if (value > 21) {
                value -= 10;
                numAces -= 1;
            } else {
                break;
            }
        }

        return value;
    }
}

module.exports = {
    Blackjack,
    Decks,
};
