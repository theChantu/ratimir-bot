const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_PATH = path.resolve(__dirname, "database.sqlite");

// Testing things
class Database {
    constructor() {
        this.db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE);
    }

    doSomething() {
        this.db.run("SQL INSTRUCTION");
    }
}

function createDatabase() {
    // TODO: Change to promise
    const db = new sqlite3.Database(
        DB_PATH,
        sqlite3.OPEN_READWRITE,
        (error) => {
            if (error) return console.error(error.message);
        }
    );
    db.run(
        "CREATE TABLE IF NOT EXISTS servers(guildId TEXT PRIMARY KEY, ratSpawned INTEGER NOT NULL);"
    );
    db.close();
}

function setupServer(guildId) {
    // TODO: Change to promise
    const db = new sqlite3.Database(
        DB_PATH,
        sqlite3.OPEN_READWRITE,
        (error) => {
            if (error) return console.error(error.message);
        }
    );

    db.all(
        "SELECT * FROM servers WHERE guildId = ?",
        [guildId],
        (err, rows) => {
            if (err) {
                console.log(err);
            }
            if (rows.length === 0) {
                db.run("INSERT INTO servers VALUES(?, ?)", [guildId, 0]);
                db.close();
            }
        }
    );
}

function updateServer(guildId, ratSpawned) {
    const db = new sqlite3.Database(
        DB_PATH,
        sqlite3.OPEN_READWRITE,
        (error) => {
            if (error) return console.error(error.message);
        }
    );

    const promise = new Promise((resolve, reject) => {
        db.run(
            "UPDATE servers SET ratSpawned = ? WHERE guildId = ?",
            [ratSpawned, guildId],
            (err) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve();
                db.close();
            }
        );
    });
    return promise;
}

async function getRatSpawned(guildId) {
    const db = new sqlite3.Database(
        DB_PATH,
        sqlite3.OPEN_READWRITE,
        (error) => {
            if (error) return console.error(error.message);
        }
    );

    const promise = new Promise((resolve, reject) => {
        db.all(
            "SELECT * FROM servers WHERE guildId = ?",
            [guildId],
            (err, rows) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                if (rows.length !== 0) {
                    resolve(rows[0].ratSpawned);
                } else {
                    resolve(null);
                }
                db.close();
            }
        );
    });

    return promise;
}

async function resetRatSpawned() {
    const db = new sqlite3.Database(
        DB_PATH,
        sqlite3.OPEN_READWRITE,
        (error) => {
            if (error) return console.error(error.message);
        }
    );

    const promise = new Promise((resolve, reject) => {
        db.run("UPDATE servers SET ratSpawned = 0", (err) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            db.close();
            resolve();
        });
    });
    return promise;
}

async function main() {
    console.log(await getRatSpawned("0"));
}
main();

module.exports = {
    createDatabase,
    setupServer,
    updateServer,
    getRatSpawned,
    resetRatSpawned,
};
