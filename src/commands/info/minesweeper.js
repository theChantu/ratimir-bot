const {
    SlashCommandBuilder,
    CommandInteraction,
    EmbedBuilder,
    MessagePayload,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");
const { db } = require("../../database/database");
const { Minesweeper } = require("../../utils/Minesweeper");
const { getRandomRat } = require("../../utils/getRandomRat");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("minesweeper")
        .setDescription("Sweep mines. Play for fun or win a rat once a day."),
    /**@param {CommandInteraction} interaction  */
    async execute(interaction) {
        await interaction.deferReply();

        const MAX_BUTTON_PER_ROW = 5;
        // Max 25
        const BUTTON_AMOUNT = 25;
        const components = [];
        const game = new Minesweeper(MAX_BUTTON_PER_ROW, MAX_BUTTON_PER_ROW);
        let firstClick = false;

        // Generate board with question marks
        let count = 0;
        for (let i = 0; i < BUTTON_AMOUNT / MAX_BUTTON_PER_ROW; i++) {
            const row = new ActionRowBuilder();
            for (let j = 0; j < MAX_BUTTON_PER_ROW; j++) {
                const cell = new ButtonBuilder()
                    .setCustomId(`${count}`)
                    .setLabel("?")
                    .setStyle(ButtonStyle.Secondary);
                row.addComponents(cell);
                count++;
            }
            components.push(row);
        }

        const embed = new EmbedBuilder()
            .setTitle("Minesweeper")
            .setDescription("Clear the board without detonating a mine.");

        const reply = await interaction.followUp({
            components,
            embeds: [embed],
        });

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 5 * 60 * 1000,
        });

        collector.on("collect", async (i) => {
            await i.deferUpdate();

            if (i.user.id !== interaction.user.id) return;

            const index = Number(i.component.customId);
            const col = Math.floor(index / MAX_BUTTON_PER_ROW);
            const row = index % MAX_BUTTON_PER_ROW;

            if (!firstClick) {
                firstClick = true;

                const components = [];

                game.generateBoard(
                    MAX_BUTTON_PER_ROW,
                    MAX_BUTTON_PER_ROW,
                    col,
                    row
                );

                game.reveal(col, row);

                const embed = new EmbedBuilder()
                    .setTitle("Minesweeper")
                    .setDescription(
                        "Clear the board without detonating a mine."
                    );

                const sweeped = game.sweeped();

                // I guess it didn't generate any mines
                if (sweeped) {
                    embed.setDescription(
                        `That's insane luck... but ${interaction.user.globalName} wins nothing.`
                    );
                }

                let count = 0;
                for (let i = 0; i < BUTTON_AMOUNT / MAX_BUTTON_PER_ROW; i++) {
                    const row = new ActionRowBuilder();
                    for (let j = 0; j < MAX_BUTTON_PER_ROW; j++) {
                        const buttonRevealed = game.board[i][j].revealed;
                        const buttonNumber = game.board[i][j].number;

                        const cell = new ButtonBuilder().setCustomId(
                            `${count}`
                        );

                        if (buttonRevealed) {
                            if (buttonNumber === -1) {
                                cell.setLabel("💣").setStyle(
                                    ButtonStyle.Danger
                                );
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

                await i.editReply({
                    components,
                    embeds: [embed],
                });
            } else {
                game.reveal(col, row);

                const components = [];
                let count = 0;
                for (let i = 0; i < BUTTON_AMOUNT / MAX_BUTTON_PER_ROW; i++) {
                    const row = new ActionRowBuilder();
                    for (let j = 0; j < MAX_BUTTON_PER_ROW; j++) {
                        const buttonRevealed = game.board[i][j].revealed;
                        const buttonNumber = game.board[i][j].number;

                        const cell = new ButtonBuilder().setCustomId(
                            `${count}`
                        );

                        if (buttonRevealed) {
                            if (buttonNumber === -1) {
                                cell.setLabel("💣").setStyle(
                                    ButtonStyle.Danger
                                );
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

                const embed = new EmbedBuilder().setTitle("Minesweeper");

                const sweeped = game.sweeped();

                // Stop collector on any game state
                if (sweeped || game.board[col][row].number === -1) {
                    collector.stop();
                }
                // Bomb is clicked
                if (game.board[col][row].number === -1) {
                    // Handle game over
                    embed.setDescription(
                        `${interaction.user.globalName} detonated a mine! 😭`
                    );
                    // Board is sweeped
                } else if (sweeped) {
                    const rat = getRandomRat();
                    // Handle game win
                    const user = await db.fetchUserMinesweeperTime(
                        interaction.guildId,
                        interaction.user.id
                    );
                    const userTime = user.minesweeperTime.getTime();
                    const currentTime = new Date().getTime();
                    const dayInMilliseconds = 24 * 60 * 60 * 1000;
                    if (userTime + dayInMilliseconds <= currentTime) {
                        await db.updateUserMinesweeperTime(
                            interaction.guildId,
                            interaction.user.id
                        );
                        await db.claimRat(
                            interaction.guildId,
                            interaction.user.id,
                            rat.name
                        );

                        embed.setDescription(
                            `${interaction.user.globalName} won a ${rat.name} rat! 🎉`
                        );
                    } else {
                        embed.setDescription(
                            `${interaction.user.globalName} won nothing!`
                        );
                    }
                } else {
                    embed.setDescription(
                        "Clear the board without detonating a mine."
                    );
                }

                await i.editReply({
                    components,
                    embeds: [embed],
                });
            }
        });

        collector.on("end", async (collected, reason) => {
            if (reason === "time") {
                const embed = new EmbedBuilder()
                    .setTitle("Minesweeper")
                    .setDescription("Time has run out.");

                await reply.edit({
                    embeds: [embed],
                });
            }
        });
    },
};
