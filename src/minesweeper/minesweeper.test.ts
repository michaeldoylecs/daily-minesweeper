import { describe, expect, test } from 'vitest';
import { MinesweeperGame } from './minesweeper-game';

describe('MinesweeperGame', () => {
    test('9 by 11 board is initialized properly', () => {
        const game = new MinesweeperGame();
        const gameBoard = game.board;
        for (let row of gameBoard) {
            for (let tile of row) {
                const isVisible = tile.isVisible;
                const isFlagged = tile.isFlagged;
                const isBomb = tile.isBomb;
                expect([isVisible, isFlagged, isBomb]).toStrictEqual([false, false, false]);
            }
        }
    });
});