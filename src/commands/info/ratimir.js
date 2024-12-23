const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ratimir")
        .setDescription("Information about ratimir."),
    async execute(interaction) {
        await interaction.reply({
            content: "Type @Ratimir (message) in chat to talk to me 🐀!",
            ephemeral: true,
        });
    },
};
