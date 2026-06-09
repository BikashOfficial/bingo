/**
 * Board Service — Core game logic for Bingo.
 * Numbers range from 1–25 on a 5×5 board.
 */

const BOARD_SIZE = 5;
const NUMBER_RANGE = { min: 1, max: 25 };

/**
 * Generates a 5×5 board with unique random numbers from 1–25.
 * @returns {number[][]} 2D array
 */
function generateBoard() {
  const numbers = [];
  const pool = new Set();

  while (pool.size < BOARD_SIZE * BOARD_SIZE) {
    const n = Math.floor(Math.random() * (NUMBER_RANGE.max - NUMBER_RANGE.min + 1)) + NUMBER_RANGE.min;
    pool.add(n);
  }

  const arr = [...pool];
  const board = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    board.push(arr.slice(i * BOARD_SIZE, (i + 1) * BOARD_SIZE));
  }
  return board;
}

/**
 * Checks which lines are completed given a player's markedCells.
 * @param {boolean[][]} markedCells - 5×5 grid of booleans
 * @returns {number[]} Array of completed line indices (0–4 rows, 5–9 cols, 10 diag, 11 anti-diag)
 */
function getCompletedLines(markedCells) {
  const completed = [];

  // Check rows (0–4)
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (markedCells[r].every(Boolean)) completed.push(r);
  }

  // Check columns (5–9)
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (markedCells.every((row) => row[c])) completed.push(BOARD_SIZE + c);
  }

  // Main diagonal (10)
  if (markedCells.every((row, i) => row[i])) completed.push(10);

  // Anti-diagonal (11)
  if (markedCells.every((row, i) => row[BOARD_SIZE - 1 - i])) completed.push(11);

  return completed;
}

/**
 * Check if a player has won (5+ distinct lines completed)
 * @param {number[]} completedLines
 * @returns {boolean}
 */
function checkWin(completedLines) {
  return completedLines.length >= 5;
}

/**
 * Given a board and a marked number, return the [row, col] position.
 * Returns null if not on board.
 * @param {number[][]} board
 * @param {number} num
 * @returns {[number, number] | null}
 */
function findNumberPosition(board, num) {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === num) return [r, c];
    }
  }
  return null;
}

module.exports = { generateBoard, getCompletedLines, checkWin, findNumberPosition, BOARD_SIZE };
