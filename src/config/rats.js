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
        name: "bilge rat",
        description: "This might be the worst rat you've ever seen.",
        weight: 50,
        image: "bilgerat.jpeg",
    },
    {
        name: "expired rat",
        description: '"Died of natural causes."',
        weight: 50,
        image: "expiredrat.jpeg",
    },
    {
        name: "stinky rat",
        description: "Get this rat a piece of cheese.",
        weight: 50,
        image: "stinkyrat.jpeg",
    },
    {
        name: "decrepit rat",
        description: "This rat has a nice lawn.",
        weight: 20,
        image: "decrepitrat.jpeg",
    },
    {
        name: "business rat",
        description: "He just works.",
        weight: 10,
        image: "business.jpeg",
    },
    {
        name: "rat dog",
        description: "Science experiment gone right.",
        weight: 10,
        image: "ratdog.jpeg",
    },
    {
        name: "iced rat",
        description: "He got his cheddar up.",
        weight: 5,
        image: "icedrat.jpeg",
    },
    {
        name: "the rat",
        description: "Some people call him Johnathan Rat.",
        weight: 1,
        image: "therat.jpeg",
    },
];

module.exports = {
    rats,
};
