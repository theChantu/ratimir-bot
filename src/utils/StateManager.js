/**
 * @typedef {Object} cache
 * @property {null | Number} timeSinceLastRatSpawn
 */

class StateManager {
    constructor() {
        /**@type {Map<string, cache>} */
        this.cache = new Map();
    }

    set(key, value) {
        this.cache.set(key, value);
    }

    get(key) {
        return this.cache.get(key);
    }
}

const stateManager = new StateManager();
module.exports = stateManager;
