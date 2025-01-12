// 1 minute in milliseconds
const MESSAGE_EDIT_INTERVAL_RATE = 1 * 60 * 1000;
// 5 minutes in milliseconds
const DELETE_MESSAGE_TIME = 5 * 60 * 1000;

// 10 seconds in milliseconds
// const MESSAGE_EDIT_INTERVAL_RATE = 10 * 1000;
// 30 seconds in milliseconds
// const DELETE_MESSAGE_TIME = 30 * 1000;

const MINIMUM_TIME_INTERVAL_RUNS = 3 * 60 * 60 * 1000;
const MAXIMUM_TIME_INTERVAL_RUNS = 8 * 60 * 60 * 1000;

// const MINIMUM_TIME_INTERVAL_RUNS = 10 * 1000;
// const MAXIMUM_TIME_INTERVAL_RUNS = 15 * 1000;

const MIN_WORD_LENGTH = 5;
const MAX_WORD_LENGTH = 8;

module.exports = {
    MESSAGE_EDIT_INTERVAL_RATE,
    DELETE_MESSAGE_TIME,
    MINIMUM_TIME_INTERVAL_RUNS,
    MAXIMUM_TIME_INTERVAL_RUNS,
    MIN_WORD_LENGTH,
    MAX_WORD_LENGTH,
};
