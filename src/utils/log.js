const DEBUG = true;

function log(...message) {
    if (DEBUG) {
        console.log(`[Ratimir]`, ...message);
    }
}

module.exports = {
    log,
};
