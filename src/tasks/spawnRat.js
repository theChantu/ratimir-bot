const {
    ActionRowBuilder,
    ButtonBuilder,
    Message,
    TextChannel,
    Client,
    EmbedBuilder,
    MessagePayload,
} = require("discord.js");
const { AttachmentBuilder } = require("discord.js");
const { DELETE_MESSAGE_TIME } = require("../config/globals");
const { log } = require("../utils/log");

/**
 * @typedef {Object} Rat
 * @property {string} name
 * @property {Number} weight
 * @property {string} image
 */

/**
 * @param {Client} client
 * @param {string} channelId
 * @param {import("../config/rats").Rat} rat
 */
async function spawnRat(client, channelId, rat) {
    const { name, description, weight, image } = rat;

    const row = new ActionRowBuilder();
    const embed = new EmbedBuilder();
    const file = new AttachmentBuilder(`./src/img/${image}`).setName(image);

    row.addComponents(
        new ButtonBuilder().setCustomId(name).setLabel("Catch").setStyle(3)
    );
    embed
        .setTitle(`${name.toUpperCase()} RAT`)
        .setDescription(description)
        .setColor("Random")
        .setImage(`attachment://${image}`)
        .setFields({
            name: "TIME UNTIL DESTRUCTION",
            value: `⏳ ${DELETE_MESSAGE_TIME / 1000 / 60} minute(s)`,
            inline: true,
        });

    /** @type {MessagePayload} */
    const messageObject = {
        components: [row],
        embeds: [embed],
        files: [file],
    };
    try {
        /**@type {TextChannel} */
        const channel = await client.channels.fetch(channelId);
        /** @type {Message}*/
        const message = await channel.send(messageObject);

        return message;
    } catch (error) {
        log("spawnRat: Could not spawn a rat.");
    }
}
module.exports = {
    spawnRat,
};
