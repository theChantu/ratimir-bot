const { Message, EmbedBuilder, ComponentType } = require("discord.js");
const { log } = require("../utils/log");
const { db } = require("../database/database");
const {
    MESSAGE_EDIT_INTERVAL_RATE,
    DELETE_MESSAGE_TIME,
} = require("../config/globals");

/** @param {Message} message @param {import("../config/rats").Rat} rat  */
async function addRatMessageInterval(message, rat) {
    // Store in case this shit gets deleted some time after interval runs
    const { guildId, id } = message;

    const { name, description, weight, image } = rat;

    const interval = setInterval(async () => {
        log("Message edit interval running...");

        const ratMessageCreatedAt = await db.getRatMessageTimestamp(guildId);

        try {
            if (Date.now() >= ratMessageCreatedAt + DELETE_MESSAGE_TIME) {
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
                await db.removeRatMessage(guildId);
                clearInterval(interval);
                return;
            }

            const timeUntilDestruction =
                ratMessageCreatedAt + DELETE_MESSAGE_TIME - Date.now();
            log(
                `Time until ${message.guild.name}'s rat gets deleted:`,
                timeUntilDestruction / 1000 / 60
            );

            const embed = new EmbedBuilder();

            embed
                .setTitle(`${name.toUpperCase()} RAT`)
                .setDescription(description)
                .setColor("Random")
                .setImage(`attachment://${image}`)
                .setFields({
                    name: "TIME UNTIL DESTRUCTION",
                    value: `⌛ ${Math.ceil(
                        timeUntilDestruction / 1000 / 60
                    )} minute(s)`,
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

            await db.removeRatMessage(guildId);
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
            await db.claimRat(guildId, interaction.user.id, name);
            await db.removeRatMessage(interaction.guildId);
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
