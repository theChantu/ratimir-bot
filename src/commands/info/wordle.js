const {
    SlashCommandBuilder,
    CommandInteraction,
    EmbedBuilder,
} = require("discord.js");
const { Wordle } = require("../../utils/Wordle");
const { db } = require("../../database/database");
const { getRandomRat } = require("../../utils/getRandomRat");
const { formatMilliseconds } = require("../../utils/formatMilliseconds");
const { MIN_WORD_LENGTH, MAX_WORD_LENGTH } = require("../../config/globals");

const choices = [];
for (let i = MIN_WORD_LENGTH; i < MAX_WORD_LENGTH + 1; i++) {
    choices.push({
        name: i.toString(),
        value: i,
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("wordle")
        .setDescription("Guess the word.")
        .addIntegerOption((option) =>
            option
                .setName("length")
                .setDescription("Set word length.")
                .setRequired(true)
                .addChoices(...choices)
        ),
    /**@param {CommandInteraction} interaction  */
    async execute(interaction) {
        const WORD_LENGTH = interaction.options.get("length").value;
        const ATTEMPTS = 5;
        const game = new Wordle(interaction, WORD_LENGTH, ATTEMPTS);

        game.on("win", async () => {
            try {
                const embed = new EmbedBuilder()
                    .setTitle("WORDLE")
                    .setImage("attachment://wordle.png");

                const rat = getRandomRat();

                const userId = interaction.user.id;
                const guildId = interaction.guildId;

                const user = await db.fetchUser(guildId, userId);

                const userTime = user.wordleTime.getTime();

                const currentTime = new Date().getTime();
                const dayInMilliseconds = 24 * 60 * 60 * 1000;

                if (userTime + dayInMilliseconds <= currentTime) {
                    await db.prisma.$transaction([
                        db.prisma.user.upsert({
                            where: {
                                id_guildId: {
                                    id: userId,
                                    guildId,
                                },
                            },
                            update: {
                                wordleTime: new Date(),
                            },
                            create: {
                                id: userId,
                                guildId,
                            },
                        }),
                        db.prisma.ratCount.upsert({
                            where: {
                                guildId_userId_ratType: {
                                    guildId,
                                    userId,
                                    ratType: rat.name,
                                },
                            },
                            update: {
                                count: { increment: 1 },
                            },
                            create: {
                                guildId,
                                userId,
                                ratType: rat.name,
                                count: 1,
                            },
                        }),
                    ]);

                    embed.setDescription(
                        `${interaction.user.globalName} won a ${rat.name} rat! 🎉`
                    );
                } else {
                    embed.setDescription(
                        `${
                            interaction.user.globalName
                        } has **${formatMilliseconds(
                            userTime + dayInMilliseconds - currentTime
                        )}** until they can win another rat.`
                    );
                }

                await interaction.editReply({
                    embeds: [embed],
                });
            } catch (error) {
                console.log(error);
            }
        });

        game.on("lose", async () => {
            try {
                const embed = new EmbedBuilder()
                    .setTitle("WORDLE")
                    .setDescription(
                        `The word was **${game.word.toUpperCase()}**`
                    )
                    .setImage("attachment://wordle.png");
                await interaction.editReply({
                    embeds: [embed],
                });
            } catch (error) {
                console.log(error);
            }
        });

        await game.start();
    },
};
