const fs = require("fs");
const path = require("path");
const { MIN_WORD_LENGTH, MAX_WORD_LENGTH } = require("../config/globals");

const NUM_OF_WORDS = 5000;

const filePath = path.join(__dirname, "../database/words.json");

const words = {};

(async () => {
    // TODO: Loop through 5 to 8 and add each word length to the words object e.g. 5: ["worde"], 6:["wordsl"]
    // The value will be the array of words returned from the API
    try {
        for (let i = MIN_WORD_LENGTH; i < MAX_WORD_LENGTH + 1; i++) {
            const result = await fetch(
                `https://random-word-api.herokuapp.com/word?number=${NUM_OF_WORDS}&length=${i}`
            );

            const data = await result.text();

            words[i] = JSON.parse(data);
        }

        fs.writeFile(filePath, JSON.stringify(words), (error) => {
            if (error) {
                console.log(error);
                console.log("Failed to save words.");
            }
        });
    } catch (error) {
        console.log(error);
        console.log("Failed to fetch words.");
    }
})();
