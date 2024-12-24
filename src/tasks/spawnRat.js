const {
    ClientUser,
    ActionRowBuilder,
    ButtonBuilder,
    Message,
    TextChannel,
    ChannelType,
    Client,
} = require("discord.js");
const { getRandomRat } = require("../utils/getRandomRat");
const stateManager = require("../utils/StateManager");
const { db } = require("../database/database");
const { log } = require("../utils/log");
const { addRatMessageInterval } = require("./addRatMessageInterval");

// TODO: Move server loop to startup event function (so that this function only handles 1 thing)
// This function will then take a server ID, and channel ID (might not be required)
/**
 * @param {Client} client
 * @param {string} channelId
 */
async function spawnRat(client, channelId) {
    const randomRat = getRandomRat();
    const row = new ActionRowBuilder();

    const [ratName, ratWeight, ratImg] = randomRat;

    row.addComponents(
        new ButtonBuilder().setCustomId(ratName).setLabel("Catch").setStyle(3)
    );
    const messageObject = {
        content: `A ${ratName}!`,
        components: [row],
    };
    /**@type {TextChannel} */
    const channel = await client.channels.fetch(channelId);
    /** @type {Message}*/
    const message = await channel.send(messageObject);
    await db.updateRatSpawned(channel.guildId, true);

    const time = Date.now();
    // Update global timeSinceLastRatSpawn
    stateManager.set("timeSinceLastRatSpawn", time);
    // Update guild timeSinceLastRatSpawn
    await db.updateTimeSinceLastRatSpawn(channel.guildId, time);
    await db.addRatMessage(channel.guildId, channelId, message.id);

    // Add cool effects to the message
    addRatMessageInterval(message, randomRat);
}
module.exports = {
    spawnRat,
};
