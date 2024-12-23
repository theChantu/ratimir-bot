const RATS = [
    ["bilge rat", 50, "image"],
    ["stingy rat", 50],
    ["stinky rat", 50],
    ["stock rat", 10],
    ["rat dog", 10],
    ["iced rat", 5],
    ["the rat", 1],
];

function getRandomRat() {
    const values = RATS.map((d) => d[0]);
    const weights = RATS.map((d) => d[1]);

    let sum = 0;
    const accumulatedWeights = [];
    let weight;

    for (weight of weights) {
        sum += weight;
        accumulatedWeights.push(sum);
    }

    const rand = Math.random() * sum;
    const value =
        RATS[accumulatedWeights.filter((element) => element <= rand).length];

    return value;
}

module.exports = {
    getRandomRat,
};
