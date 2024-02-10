const { SlashCommandBuilder } = require("discord.js");

const BALLS_BE_GONE = [
    "demolished",
    "crushed",
    "obliterated",
    "destroyed",
    "smashed",
    "perished",
    "annihilated",
    "wrecked",
    "ruined",
    "shattered",
    "decimated",
    "eradicated",
    "pulverized",
    "extinguished",
    "exterminated",
    "eliminated",
    "erased",
    "removed",
    "deleted",
    "terminated",
    "smothered",
    "suffocated",
    "strangled",
    "squeezed",
    "choked",
    "gripped",
    "drowned",
    "sunk",
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("cbt")
        .setDescription("Crush a man or woman's balls.")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user to crush.")
                .setRequired(true)
        ),
    async execute(interaction) {
        const user = interaction.options.getUser("user");

        const randomIndex = Math.floor(Math.random() * BALLS_BE_GONE.length);

        if (user.id === interaction.user.id) {
            return await interaction.reply({
                content: `${user} ${BALLS_BE_GONE[randomIndex]} their own balls! 😳`,
            });
        }

        await interaction.reply({
            content: `${user} Your balls have been ${BALLS_BE_GONE[randomIndex]} by ${interaction.user}! 🔨😭`,
        });
    },
};
