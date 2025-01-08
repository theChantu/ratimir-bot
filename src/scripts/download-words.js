const fs = require("fs");
const path = require("path");

const NUM_OF_WORDS = 5000;
const WORD_LENGTH = 5;

const filePath = path.join(__dirname, "../database/words.json");

(async () => {
    try {
        const result = await fetch(
            `https://random-word-api.herokuapp.com/word?number=${NUM_OF_WORDS}&length=${WORD_LENGTH}`
        );

        const data = await result.text();

        fs.writeFile(filePath, data, (error) => {
            if (error) {
                console.log(error);
                console.log("Failed to save words.");
            }
        });
    } catch (error) {
        console.log("Failed to fetch words.");
    }
})();
