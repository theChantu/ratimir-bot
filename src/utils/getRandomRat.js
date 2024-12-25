const { rats } = require("../config/rats");

function getRandomRat() {
    const values = rats.map((d) => d.name);
    const weights = rats.map((d) => d.weight);

    let sum = 0;
    const accumulatedWeights = [];
    let weight;

    for (weight of weights) {
        sum += weight;
        accumulatedWeights.push(sum);
    }

    const rand = Math.random() * sum;
    const value =
        rats[accumulatedWeights.filter((element) => element <= rand).length];

    return value;
}

module.exports = {
    getRandomRat,
};
