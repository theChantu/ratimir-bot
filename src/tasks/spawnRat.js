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

/**
 * @typedef {Object} Rat
 * @property {string} name
 * @property {Number} weight
 * @property {string} image
 */

/**
 * @param {Client} client
 * @param {string} channelId
 * @param {Rat} rat
 */
async function spawnRat(client, channelId, rat) {
    const { name, weight, image } = rat;

    const row = new ActionRowBuilder();
    const embed = new EmbedBuilder();
    const file = new AttachmentBuilder(`./src/img/${image}`).setName(image);

    row.addComponents(
        new ButtonBuilder().setCustomId(name).setLabel("Catch").setStyle(3)
    );
    embed
        .setTitle(name.toUpperCase())
        .setDescription("Holy mother of god.")
        .setColor("Random")
        .setImage(`attachment://${image}`)
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

    return message;
}
module.exports = {
    spawnRat,
};
