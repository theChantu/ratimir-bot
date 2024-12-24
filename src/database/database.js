const { PrismaClient } = require("@prisma/client");
const { log } = require("../utils/log");

// Testing things
class Database {
    constructor() {
        this.prisma = new PrismaClient();
    }

    /** @param {string} guildId  */
    async setupServer(guildId) {
        try {
            const guild = await this.prisma.server.findUnique({
                where: {
                    guildId: guildId,
                },
            });
            log("foundGuild:", guild);
            // Only add if it doesn't exist
            if (guild === null) {
                await this.prisma.server.create({
                    data: {
                        guildId: guildId,
                    },
                });
            }
        } catch (error) {
            log(error);
        }
    }

    /** @param {string} guildId @param {boolean} ratSpawned  */
    async updateRatSpawned(guildId, ratSpawned) {
        try {
            await this.prisma.server.update({
                where: {
                    guildId: guildId,
                },
                data: {
                    ratSpawned: ratSpawned,
                },
            });
        } catch (error) {
            log(error);
        }
    }

    /** @param {string} guildId  */
    async getRatSpawned(guildId) {
        try {
            const server = await this.prisma.server.findUnique({
                where: {
                    guildId: guildId,
                },
            });
            return server.ratSpawned;
        } catch (error) {
            log(error);
        }
    }

    async resetRatSpawned() {
        try {
            await this.prisma.server.updateMany({
                data: {
                    ratSpawned: false,
                },
            });
        } catch (error) {
            log(error);
        }
    }

    /** @param {string} guildId @param {Number} timeSinceLastRatSpawn   */
    async updateTimeSinceLastRatSpawn(guildId, timeSinceLastRatSpawn) {
        try {
            await this.prisma.server.update({
                where: {
                    guildId: guildId,
                },
                data: {
                    timeSinceLastSpawn: timeSinceLastRatSpawn.toString(),
                },
            });
        } catch (error) {
            log(error);
        }
    }

    /** @param {string} guildId */
    async getTimeSinceLastRatSpawn(guildId) {
        try {
            const server = await this.prisma.server.findUnique({
                where: {
                    guildId: guildId,
                },
            });
            return Number(server.timeSinceLastSpawn);
        } catch (error) {
            log(error);
        }
    }

    /** @param {string} guildId @param {string} channelId @param {string} messageId   */
    async addRatMessage(guildId, channelId, messageId) {
        try {
            await this.prisma.ratMessage.create({
                data: {
                    guildId: guildId,
                    channelId: channelId,
                    messageId: messageId,
                },
            });
        } catch (error) {
            log(error);
        }
    }

    /** @param {string} messageId   */
    async removeRatMessage(messageId) {
        try {
            await this.prisma.ratMessage.delete({
                where: {
                    messageId: messageId,
                },
            });
        } catch (error) {
            log(error);
        }
    }
}

const db = new Database();

module.exports = {
    db,
};
