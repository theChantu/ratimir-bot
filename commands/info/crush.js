const { randomEmoji } = require("../../tools");

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
        .setName("crush")
        .setDescription("Crush a man or woman's balls.")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user to crush.")
                .setRequired(true)
        ),
    async execute(interaction) {
        const user = interaction.options.getUser("user");

        const randomNum = Math.floor(Math.random() * 100);

        const randomIndex = Math.floor(Math.random() * BALLS_BE_GONE.length);

        interaction.deferReply();

        if (randomNum === 0 && user.id !== interaction.user.id) {
            await interaction.channel.send({
                content: `${user} your balls were going to be ${BALLS_BE_GONE[randomIndex]}, but you got lucky and ${interaction.user}'s balls have been ${BALLS_BE_GONE[randomIndex]} instead! 🥳`,
            });
        } else if (user.id === interaction.user.id) {
            await interaction.channel.send({
                content: `${user} ${
                    BALLS_BE_GONE[randomIndex]
                } their own balls! ${randomEmoji()}`,
            });
        } else {
            await interaction.channel.send({
                content: `${user} your balls have been ${
                    BALLS_BE_GONE[randomIndex]
                } by ${interaction.user}! ${randomEmoji()}`,
            });
        }

        interaction.deleteReply();
    },
};
