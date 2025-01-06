const { PrismaClient } = require("@prisma/client");
const { log } = require("../utils/log");
const { Client } = require("discord.js");

// Testing things
class Database {
    constructor() {
        this.prisma = new PrismaClient();
    }

    /** @param {Client} client  */
    async setup(client) {
        try {
            const guilds = client.guilds.cache;

            for (const [string, guild] of guilds) {
                await this.setupServer(guild.id);
            }
        } catch (error) {
            log(error);
        }
    }

    /** @param {string} guildId  */
    async setupServer(guildId) {
        try {
            await this.prisma.guild.upsert({
                where: { id: guildId },
                update: { id: guildId },
                create: {
                    id: guildId,
                },
            });
        } catch (error) {
            log(error);
        }
    }

    /** @param {string} guildId @param {string} userId  */
    async addUser(guildId, userId) {
        try {
            await this.prisma.user.upsert({
                where: {
                    id_guildId: {
                        id: userId,
                        guildId,
                    },
                },
                update: {},
                create: { id: userId, guildId },
            });
        } catch (error) {
            log(error);
        }
    }

    /** @param {string} guildId  */
    async isRatSpawned(guildId) {
        try {
            const guild = await this.prisma.guild.findUnique({
                where: {
                    id: guildId,
                },
                include: {
                    ratMessage: true,
                },
            });

            if (guild.ratMessage !== null) return true;
            return false;
        } catch (error) {
            log(error);
        }
    }

    /** @param {string} guildId */
    async getRatMessageTimestamp(guildId) {
        try {
            const message = await this.prisma.ratMessage.findUnique({
                where: {
                    guildId,
                },
            });
            return message.createdAt.getTime();
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

    /** @param {string} guildId   */
    async removeRatMessage(guildId) {
        try {
            await this.prisma.ratMessage.delete({
                where: {
                    guildId,
                },
            });
        } catch (error) {
            log(error);
        }
    }

    /** @param {string} guildId  @param {string} userId @param {string} ratType @param {number} [amount=1]  */
    async claimRat(guildId, userId, ratType, amount = 1) {
        try {
            await this.prisma.$transaction([
                // Create user if not exist
                this.prisma.user.upsert({
                    where: {
                        id_guildId: {
                            id: userId,
                            guildId,
                        },
                    },
                    update: {},
                    create: { id: userId, guildId },
                }),
                // Update user ratcount
                this.prisma.ratCount.upsert({
                    where: {
                        guildId_userId_ratType: { guildId, userId, ratType },
                    },
                    update: {
                        count: { increment: amount },
                    },
                    create: {
                        guildId,
                        userId,
                        ratType,
                        count: 1,
                    },
                }),
            ]);
        } catch (error) {
            log(error);
        }
    }

    /** @param {string} guildId  @param {string} userId @param {string} ratType  @param {Number} amount */
    async removeRat(guildId, userId, ratType, amount) {
        try {
            await this.prisma.ratCount.update({
                where: {
                    guildId_userId_ratType: {
                        guildId,
                        userId,
                        ratType,
                    },
                },
                data: {
                    count: { decrement: amount },
                },
            });
        } catch (error) {
            log(error);
        }
    }

    /** @param {string} guildId  @param {string} userId  */
    async fetchUsersRats(guildId, userId) {
        try {
            const user = await this.prisma.ratCount.findMany({
                where: {
                    guildId: guildId,
                    userId: userId,
                },
            });

            return user;
        } catch (error) {
            log(error);
        }
    }

    /** @param {string} guildId  */
    async fetchGuildRats(guildId) {
        try {
            const guild = await this.prisma.ratCount.findMany({
                where: {
                    guildId: guildId,
                },
            });

            return guild;
        } catch (error) {
            log(error);
        }
    }

    async updateUserMinesweeperTime(guildId, userId) {
        try {
            await this.prisma.user.update({
                where: {
                    id_guildId: {
                        id: userId,
                        guildId,
                    },
                },
                data: {
                    minesweeperTime: new Date(),
                },
            });
        } catch (error) {
            log(error);
        }
    }

    /** @param {string} guildId @param {string} userId   */
    async fetchUser(guildId, userId) {
        try {
            await this.prisma.user.upsert({
                where: {
                    id_guildId: {
                        id: userId,
                        guildId,
                    },
                },
                update: {},
                create: {
                    id: userId,
                    guildId,
                },
            });
            const user = await this.prisma.user.findUnique({
                where: {
                    id_guildId: {
                        id: userId,
                        guildId,
                    },
                },
            });

            return user;
        } catch (error) {
            log(error);
        }
    }
}

const db = new Database();

module.exports = {
    db,
};
