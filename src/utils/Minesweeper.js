const events = require("events");
const {
    ActionRowBuilder,
    CommandInteraction,
    ButtonStyle,
    createMessageComponentCollector,
    ComponentType,
    ButtonBuilder,
    EmbedBuilder,
} = require("discord.js");

/**
 * @typedef {Object} cell
 * @property {boolean} revealed
 * @property {Number} number
 */

class Minesweeper extends events {
    /** @param {Number} col  @param {Number} row  */
    constructor(col, row, interaction) {
        super();
        this.colSize = col;
        this.rowSize = row;
        /** @type {Array<Array<cell>> | undefined} */
        this.board;
        this.mineCount = 0;
        /** @type {CommandInteraction} */
        this.interaction = interaction;
    }

    async start() {
        await this.interaction.deferReply();

        this.generateBoard();

        const components = this.generateComponents();

        const embed = new EmbedBuilder()
            .setTitle("MINESWEEPER")
            .setDescription("Clear the board without detonating a mine.")
            .setFields({
                name: "Mines",
                value: this.mineCount.toString(),
            });

        const reply = await this.interaction.followUp({
            components,
            embeds: [embed],
        });

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 5 * 60 * 1000,
        });

        collector.on("collect", async (i) => {
            await i.deferUpdate();

            if (i.user.id !== this.interaction.user.id) return;

            const index = Number(i.component.customId);
            const col = Math.floor(index / this.rowSize);
            const row = index % this.rowSize;

            this.reveal(col, row);

            const components = this.generateComponents();

            const sweeped = this.sweeped();

            await i.editReply({
                components,
            });

            if (this.board[col][row].number === -1) {
                this.emit("bomb");
            } else if (sweeped) {
                this.emit("sweeped");
            }

            if (sweeped || this.board[col][row].number === -1) {
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
        if (this.sweeped() === true) {
            this.emit("sweeped");
            collector.stop();
        }
    }

    generateBoard() {
        const omitCol = Math.floor(Math.random() * this.colSize);
        const omitRow = Math.floor(Math.random() * this.rowSize);
        // -1 = BOMB, 0 or Infinity = NOT BOMB
        const board = [];
        for (let i = 0; i < this.colSize; i++) {
            const col = [];
            for (let j = 0; j < this.rowSize; j++) {
                if (i === omitCol && j === omitRow) {
                    col.push({
                        revealed: true,
                        number: 0,
                    });
                    continue;
                }
                const obj = {
                    revealed: false,
                };
                const randomNum = Math.floor(Math.random() * 100 + 1);
                if (randomNum <= 80) {
                    obj.number = 0;
                } else {
                    obj.number = -1;
                    this.mineCount += 1;
                }
                col.push(obj);
            }
            board.push(col);
        }

        // Generate numbers
        for (let i = 0; i < this.colSize; i++) {
            for (let j = 0; j < this.rowSize; j++) {
                if (board[i][j].number !== -1) {
                    const neighbors = this.getNeighbors(i, j);
                    for (const neighbor of neighbors) {
                        const [nCol, nRow] = neighbor;
                        if (board[nCol][nRow].number === -1) {
                            board[i][j].number += 1;
                        }
                    }
                }
            }
        }

        this.board = board;

        this.reveal(omitCol, omitRow);
    }

    /** @param {Number} col @param {Number} row   */
    reveal(col, row) {
        // If bomb or cell that is next to bombs
        this.board[col][row].revealed = true;
        if (
            this.board[col][row].number > 0 ||
            this.board[col][row].number === -1
        ) {
            return;
        } else {
            const neighbors = this.getNeighbors(col, row);
            for (const neighbor of neighbors) {
                const [nCol, nRow] = neighbor;
                if (this.board[nCol][nRow].revealed === false) {
                    this.board[nCol][nRow].revealed = true;
                    this.reveal(nCol, nRow);
                }
            }
        }
    }

    /** @param {Number} col @param {Number} row   */
    getNeighbors(col, row) {
        const sides = [
            [0, 1],
            [1, 0],
            [1, 1],
            [0, -1],
            [-1, 0],
            [-1, -1],
            [1, -1],
            [-1, 1],
        ];
        const neighbors = [];
        for (const side of sides) {
            const [sCol, sRow] = side;
            const nCol = sCol + col;
            const nRow = sRow + row;
            // Check if this neighbor is not out of bounds
            if (
                nCol >= 0 &&
                nCol < this.colSize &&
                nRow >= 0 &&
                nRow < this.rowSize
            ) {
                neighbors.push([nCol, nRow]);
            }
        }
        return neighbors;
    }

    sweeped() {
        for (const row of this.board) {
            for (const cell of row) {
                if (
                    (cell.number !== -1 && cell.revealed === false) ||
                    (cell.number === -1 && cell.revealed === true)
                ) {
                    return false;
                }
            }
        }
        return true;
    }

    generateComponents() {
        const MAX_BUTTON_PER_ROW = this.rowSize;
        const BUTTON_AMOUNT = this.colSize * this.rowSize;

        const components = [];
        let count = 0;

        for (let i = 0; i < BUTTON_AMOUNT / MAX_BUTTON_PER_ROW; i++) {
            const row = new ActionRowBuilder();
            for (let j = 0; j < MAX_BUTTON_PER_ROW; j++) {
                const buttonRevealed = this.board[i][j].revealed;
                const buttonNumber = this.board[i][j].number;

                const cell = new ButtonBuilder().setCustomId(`${count}`);

                if (buttonRevealed) {
                    if (buttonNumber === -1) {
                        cell.setLabel("💣").setStyle(ButtonStyle.Danger);
                    } else if (buttonNumber === 0) {
                        cell.setLabel(
                            this.board[i][j].number.toString()
                        ).setStyle(ButtonStyle.Success);
                    } else {
                        cell.setLabel(
                            this.board[i][j].number.toString()
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
}

module.exports = {
    Minesweeper,
};
