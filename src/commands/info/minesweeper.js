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

module.exports = {
    data: new SlashCommandBuilder()
        .setName("minesweeper")
        .setDescription("Sweep mines. Play for fun or win a rat once per day."),
    /**@param {CommandInteraction} interaction  */
    async execute(interaction) {
        const game = new Minesweeper(5, 5, interaction);
        game.start();

        game.on("bomb", async () => {
            const embed = new EmbedBuilder()
                .setTitle("MINESWEEPER")
                .setDescription(
                    `${interaction.user.displayName} detonated a mine.`
                );
            await interaction.editReply({ embeds: [embed] });
        });

        game.on("sweeped", async () => {
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
                    `${interaction.user.globalName} won nothing!`
                );
            }

            await interaction.editReply({ embeds: [embed] });
        });
    },
};
