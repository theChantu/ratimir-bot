/**
 * @typedef {Object} cell
 * @property {boolean} revealed
 * @property {Number} number
 */

class Minesweeper {
    /** @param {Number} col  @param {Number} row  */
    constructor(col, row) {
        this.colSize = col;
        this.rowSize = row;
        /** @type {Array<Array<cell>> | undefined} */
        this.board;
    }

    /** @param {Number} col  @param {Number} row  @param {Number} omitCol @param {Number} omitRow  */
    generateBoard(row, col, omitCol, omitRow) {
        // -1 = BOMB, 0 or Infinity = NOT BOMB
        const board = [];
        for (let i = 0; i < col; i++) {
            const col = [];
            for (let j = 0; j < row; j++) {
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
                randomNum <= 70 ? (obj.number = 0) : (obj.number = -1);
                col.push(obj);
            }
            board.push(col);
        }

        // Generate numbers
        for (let i = 0; i < col; i++) {
            for (let j = 0; j < row; j++) {
                if (board[i][j].number !== -1) {
                    const neighbors = this.getNeighbors(i, j);
                    // console.log(board[i][j]);
                    // console.log(neighbors);
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
                if (cell.number !== -1 && cell.revealed === false) {
                    return false;
                }
            }
        }
        return true;
    }
}

module.exports = {
    Minesweeper,
};
