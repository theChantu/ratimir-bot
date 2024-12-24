const {
    ActionRowBuilder,
    ButtonBuilder,
    Message,
    TextChannel,
    Client,
    EmbedBuilder,
    MessagePayload,
} = require("discord.js");
const { getRandomRat } = require("../utils/getRandomRat");
const stateManager = require("../utils/StateManager");
const { db } = require("../database/database");
const { log } = require("../utils/log");
const { addRatMessageInterval } = require("./addRatMessageInterval");
const { AttachmentBuilder } = require("discord.js");
const {
    MESSAGE_EDIT_INTERVAL_RATE,
    DELETE_MESSAGE_TIME,
} = require("../config/globals");

// TODO: Move server loop to startup event function (so that this function only handles 1 thing)
// This function will then take a server ID, and channel ID (might not be required)
/**
 * @param {Client} client
 * @param {string} channelId
 */
async function spawnRat(client, channelId) {
    const randomRat = getRandomRat();
    const [ratName, ratWeight, ratImg] = randomRat;

    const row = new ActionRowBuilder();
    const embed = new EmbedBuilder();
    const file = new AttachmentBuilder(`./src/img/${ratImg}`).setName(ratImg);

    row.addComponents(
        new ButtonBuilder().setCustomId(ratName).setLabel("Catch").setStyle(3)
    );
    embed
        .setTitle(ratName.toUpperCase())
        .setDescription("Holy mother of god.")
        .setColor("Random")
        .setImage(`attachment://${ratImg}`)
        .setFields({
            name: "Time until destruction:",
            value: `💣 ${DELETE_MESSAGE_TIME / 1000 / 60} minute(s)`,
            inline: true,
        });

    /** @type {MessagePayload} */
    const messageObject = {
        components: [row],
        embeds: [embed],
        files: [file],
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
