/**
 * @typedef {Object} Rat
 * @property {string} name
 * @property {string} description
 * @property {Number} weight
 * @property {string} image
 */

/** @type {Array<Rat>} */
const rats = [
    {
        name: "bilge",
        description: "This might be the worst rat you've ever seen.",
        weight: 50,
        image: "bilgerat.jpeg",
    },
    {
        name: "expired",
        description: '"Died of natural causes."',
        weight: 50,
        image: "expiredrat.jpeg",
    },
    {
        name: "stinky",
        description: "Who opened a bag of Lay's?",
        weight: 50,
        image: "stinkyrat.jpeg",
    },
    {
        name: "decrepit",
        description: "Don't touch his lawn.",
        weight: 20,
        image: "decrepitrat.jpeg",
    },
    {
        name: "business",
        description: "Let's put a pin in that and come back to it later.",
        weight: 10,
        image: "business.jpeg",
    },
    {
        name: "dog",
        description: "???",
        weight: 10,
        image: "ratdog.jpeg",
    },
    {
        name: "iced",
        description: "He got the low taper fade. 😭",
        weight: 5,
        image: "icedrat.jpeg",
    },
    {
        name: "rat",
        description: "WHAT THE SIGMA>!?!?!?!???! 💀",
        weight: 1,
        image: "therat.jpeg",
    },
];

module.exports = {
    rats,
};
