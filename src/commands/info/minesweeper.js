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
        await interaction.deferReply();

        const MAX_BUTTON_PER_ROW = 5;
        const BUTTON_AMOUNT = 25;

        const game = new Minesweeper(MAX_BUTTON_PER_ROW, MAX_BUTTON_PER_ROW);
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
            // Handle game win
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

        const components = generateComponents(game.board);

        const embed = new EmbedBuilder()
            .setTitle("MINESWEEPER")
            .setDescription("Clear the board without detonating a mine.")
            .setFields({
                name: "Mines",
                value: game.mineCount.toString(),
            });

        const reply = await interaction.followUp({
            components,
            embeds: [embed],
        });

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 5 * 60 * 1000,
        });

        /** @param {Array<Array<import("../../utils/Minesweeper").cell>>} board  */
        function generateComponents(board) {
            const components = [];
            let count = 0;

            for (let i = 0; i < BUTTON_AMOUNT / MAX_BUTTON_PER_ROW; i++) {
                const row = new ActionRowBuilder();
                for (let j = 0; j < MAX_BUTTON_PER_ROW; j++) {
                    const buttonRevealed = game.board[i][j].revealed;
                    const buttonNumber = game.board[i][j].number;

                    const cell = new ButtonBuilder().setCustomId(`${count}`);

                    if (buttonRevealed) {
                        if (buttonNumber === -1) {
                            cell.setLabel("💣").setStyle(ButtonStyle.Danger);
                        } else if (buttonNumber === 0) {
                            cell.setLabel(
                                game.board[i][j].number.toString()
                            ).setStyle(ButtonStyle.Success);
                        } else {
                            cell.setLabel(
                                game.board[i][j].number.toString()
                            ).setStyle(ButtonStyle.Primary);
                        }
                    } else {
                        cell.setLabel("?").setStyle(ButtonStyle.Secondary);
                    }
                    row.addComponents(cell);
                    count++;
                }
                components.push(row);
            }

            return components;
        }

        collector.on("collect", async (i) => {
            await i.deferUpdate();

            if (i.user.id !== interaction.user.id) return;

            const index = Number(i.component.customId);
            const col = Math.floor(index / MAX_BUTTON_PER_ROW);
            const row = index % MAX_BUTTON_PER_ROW;

            game.reveal(col, row);

            const components = generateComponents(game.board);

            const sweeped = game.sweeped();

            await i.editReply({
                components,
            });

            if (game.board[col][row].number === -1) {
                game.emit("bomb");
            } else if (sweeped) {
                game.emit("sweeped");
            }

            if (sweeped || game.board[col][row].number === -1) {
                collector.stop();
            }
        });

        collector.on("end", async (collected, reason) => {
            if (reason === "time") {
                const embed = new EmbedBuilder()
                    .setTitle("MINESWEEPER")
                    .setDescription("Time has run out.");

                await reply.edit({
                    embeds: [embed],
                });
            }
        });

        // Handle case where board is already sweeped
        if (game.sweeped() === true) {
            game.emit("sweeped");
            collector.stop();
        }
    },
};
