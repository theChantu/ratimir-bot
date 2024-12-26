const { Message, EmbedBuilder, ComponentType } = require("discord.js");
const { log } = require("../utils/log");
const { db } = require("../database/database");
const {
    MESSAGE_EDIT_INTERVAL_RATE,
    DELETE_MESSAGE_TIME,
} = require("../config/globals");

/** @param {Message} message */
async function addRatMessageInterval(message, rat) {
    // Store in case this shit gets deleted some time after interval runs
    const { guildId, id } = message;

    const { name, weight, image } = rat;

    const interval = setInterval(async () => {
        log("Message edit interval running...");

        const timeSinceLastRatSpawn = await db.getTimeSinceLastRatSpawn(
            guildId
        );

        try {
            if (Date.now() >= timeSinceLastRatSpawn + DELETE_MESSAGE_TIME) {
                await message.edit({
                    content: "*blows up*",
                    components: [],
                });
                // setTimeout(async () => {
                //     message.delete(3000).catch((error) => {
                //         log(error);
                //         db.updateRatSpawned(channel.guild.id, false);
                //     });
                // }, 3000);
                await message.delete();
                await db.updateRatSpawned(guildId, false);
                await db.removeRatMessage(id);
                clearInterval(interval);
                return;
            }

            const timeUntilDestruction =
                timeSinceLastRatSpawn + DELETE_MESSAGE_TIME - Date.now();
            log(
                `Time until ${message.guild.name}'s rat gets deleted:`,
                timeUntilDestruction / 1000 / 60
            );

            const embed = new EmbedBuilder();

            embed
                .setTitle(name.toUpperCase())
                .setDescription("Holy mother of god.")
                .setColor("Random")
                .setImage(`attachment://${image}`)
                .setFields({
                    name: "Time until destruction:",
                    value: `💣 ${timeUntilDestruction / 1000 / 60} minute(s)`,
                    inline: true,
                });

            await message.edit({
                embeds: [embed],
            });
        } catch (error) {
            if (error.code === 10008) {
                log("addRatMessageInterval: Message not found.");
            } else {
                log(error);
            }

            await db.updateRatSpawned(guildId, false);
            await db.removeRatMessage(id);
            clearInterval(interval);
        }
    }, MESSAGE_EDIT_INTERVAL_RATE);

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        max: 1,
    });

    collector.on("collect", async (interaction) => {
        try {
            const guildId = interaction.guildId;
            log(
                interaction.user.globalName,
                `caught a ${interaction.customId}!`
            );
            await db.updateRatSpawned(guildId, false);
            await db.claimRat(guildId, interaction.user.id, name);
            await db.removeRatMessage(interaction.message.id);
            await interaction.message.delete();
        } catch (error) {
            log(error);
        } finally {
            clearInterval(interval);
        }
    });

    // return () => clearInterval(interval);
}

module.exports = {
    addRatMessageInterval,
};
