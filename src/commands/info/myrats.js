const {
    SlashCommandBuilder,
    CommandInteraction,
    EmbedBuilder,
    MessagePayload,
} = require("discord.js");
const { db } = require("../../database/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("myrats")
        .setDescription("Oh shit... my rats."),
    /**@param {CommandInteraction} interaction  */
    async execute(interaction) {
        const user = await db.fetchUsersRats(
            interaction.guildId,
            interaction.user.id
        );
        const embed = new EmbedBuilder();

        const fields = user.map((rat) => {
            return { name: rat.ratType, value: rat.count.toString() };
        });

        embed
            .setTitle(`${interaction.user.username}'s rats`)
            .setColor("Random")
            .addFields(fields);

        /** @type {MessagePayload} */
        const messagePayload = {
            embeds: [embed],
        };

        await interaction.reply(messagePayload);
    },
};
