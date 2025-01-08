const {
    SlashCommandBuilder,
    CommandInteraction,
    EmbedBuilder,
    MessagePayload,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ComponentType,
    ButtonInteraction,
} = require("discord.js");
const { db } = require("../../database/database");
const { Minesweeper } = require("../../utils/Minesweeper");
const { getRandomRat } = require("../../utils/getRandomRat");
const { formatMilliseconds } = require("../../utils/formatMilliseconds");
const { log } = require("../../utils/log");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("minesweeper")
        .setDescription("Sweep mines. Play for fun or win a rat once per day."),
    /**@param {CommandInteraction} interaction  */
    async execute(interaction) {
        const NUM_OF_COLS = 5;
        const NUM_OF_ROWS = 5;

        const MIN_BOMBS = 5;
        const MAX_BOMBS = 8;

        const game = new Minesweeper(
            NUM_OF_COLS,
            NUM_OF_ROWS,
            MIN_BOMBS,
            MAX_BOMBS,
            interaction
        );
        await game.start();

        game.on("bomb", async () => {
            try {
                const embed = new EmbedBuilder()
                    .setTitle("MINESWEEPER")
                    .setDescription(
                        `${interaction.user.displayName} detonated a mine.`
                    );
                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                log(error);
            }
        });

        game.on("sweeped", async () => {
            try {
                const embed = new EmbedBuilder().setTitle("MINESWEEPER");

                const rat = getRandomRat();

                const userId = interaction.user.id;
                const guildId = interaction.guildId;

                const user = await db.fetchUser(guildId, userId);

                const userTime = user.minesweeperTime.getTime();

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
                                minesweeperTime: new Date(),
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

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                log(error);
            }
        });
    },
};
