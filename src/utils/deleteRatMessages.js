const { Client } = require("discord.js");
const { PrismaClient } = require("@prisma/client");
const { log } = require("../utils/log");
const { TextChannel } = require("discord.js");
const { db } = require("../database/database");

/** @param {Client} client  */
async function deleteRatMessages(client) {
    const prisma = new PrismaClient();

    const guildsWithRats = await prisma.ratMessage.findMany();

    for (const { id, guildId, channelId, messageId } of guildsWithRats) {
        try {
            /** @type {TextChannel} */
            const channel = client.channels.cache.get(channelId);
            const message = await channel.messages.fetch(messageId);
            await message.delete();
        } catch (error) {
            if (error.code === 10008) {
                log("deleteRatMessages: Message not found.");
            } else {
                log(error);
            }
        } finally {
            // Remove this message from database it's not my problem anymore
            try {
                await db.removeRatMessage(messageId);
            } catch (error) {
                log("deleteRatMessages: Could not delete message from db.");
            }
        }
    }
}

module.exports = {
    deleteRatMessages,
};
