/**
 * @typedef {Object} Rat
 * @property {string} name
 * @property {Number} weight
 * @property {string} image
 */

/** @type {Array<Rat>} */
const rats = [
    { name: "bilge rat", weight: 50, image: "bilgerat.jpeg" },
    { name: "stingy rat", weight: 50, image: "stingyrat.jpeg" },
    { name: "stinky rat", weight: 50, image: "stinkyrat.jpeg" },
    { name: "stock rat", weight: 10, image: "stockrat.jpeg" },
    { name: "rat dog", weight: 10, image: "ratdog.jpeg" },
    { name: "iced rat", weight: 5, image: "icedrat.jpeg" },
    { name: "the rat", weight: 1, image: "therat.jpeg" },
];

module.exports = {
    rats,
};
