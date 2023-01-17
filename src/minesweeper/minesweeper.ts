import Rand from 'rand-seed'; 
import { makeAutoObservable } from 'mobx';

class BoardTile {
    readonly isBomb: boolean;
    public adjacentBombCount: number;
    public isVisible: boolean;
    public isFlagged: boolean;

    constructor(
        isVisible: boolean = false,
        isFlagged: boolean = false,
        isBomb: boolean = false,
        adjacentBombCount: number = -1
    ) {
        this.isVisible = isVisible;
        this.isFlagged = isFlagged;
        this.isBomb = isBomb;
        this.adjacentBombCount = adjacentBombCount;
    }

    public static Bomb(): BoardTile {
        return new BoardTile(false, false, true, -1);
    }

    public static SafeTile(adjacentBombs: number): BoardTile {
        return new BoardTile(false, false, false, adjacentBombs);
    } 
}

class MinesweeperGame {
    readonly mineCount: number;
    readonly boardRows: number;
    readonly boardColumns: number;
    readonly _seed: string = 'TESTSEED';
    private _board: BoardTile[][];

    constructor(boardWidth: number = 9, boardHeight: number = 9, mineCount: number = 20) {
        makeAutoObservable(this);
        this._board = this.createEmptyBoard(boardWidth, boardHeight);
        this.boardRows = this._board.length;
        this.boardColumns = this._board[0].length; // Assumes board > 0 rows
        this.mineCount = mineCount;
        this._board = this.generateGameBoard();
    }

    public get board(): BoardTile[][] { 
        return this._board;
    }

    private set board(newBoard) {
        this._board = newBoard;
        return;
    }

    private createEmptyBoard(width: number, height: number): BoardTile[][] {
        let board: BoardTile[][] = new Array(height);
        for (let j = 0; j < height; ++j) {
            board[j] = new Array(width);
            for (let k = 0; k < width; ++k) {
                board[j][k] = BoardTile.SafeTile(0);
            }
        }
        return board;
    }
    
    private generateGameBoard(): BoardTile[][] {
        let rng = new Rand(this._seed);
        const minePositions = this.chooseSeededMinePositions(rng);
        let board = this.createEmptyBoard(this.boardColumns, this.boardRows);
        for (const bomb of minePositions) {
            const [x, y] = bomb;
            board[x][y] = BoardTile.Bomb();
            this.incrementAdjacentTiles(board, x, y)
        }
        return board;
    }

    private incrementAdjacentTiles(board: BoardTile[][], x: number, y: number) {
        const NW = [-1, -1];
        const N  = [ 0, -1];
        const NE = [ 1, -1];
        const E  = [ 1,  0];
        const SE = [ 1,  1];
        const S  = [ 0,  1];
        const SW = [-1,  1];
        const W  = [-1,  0];
        const adjacencies = [NW, N, NE, E, SE, S, SW, W];
        for (const adjacency of adjacencies) {
            const [dx, dy] = adjacency;
            const adjX = x + dx;
            const adjY = y + dy;
            if (adjX < 0 || adjX >= this.boardColumns || adjY < 0 || adjY >= this.boardRows) {
                continue;
            }
            board[adjX][adjY].adjacentBombCount += 1;
        }
    }

    private chooseSeededMinePositions(rng: Rand): [number, number][] {
        let cycleCount = 0;
        let minePositions: [number, number][] = [];
        let chosenMines = 0;
        while (chosenMines < this.mineCount) {
            const mineX = this.nextRandomNumberBetween(0, this.boardColumns - 1, rng);
            const mineY = this.nextRandomNumberBetween(0, this.boardRows - 1, rng);
            if (!this.listContains(minePositions, ([x, y]) => mineX === x && mineY === y)) {
                minePositions.push([mineX, mineY]);
                chosenMines++;
            }
            cycleCount++;
            if (cycleCount > 1000) {
                throw Error;
            }
        }
        return minePositions;
    }

    private listContains<T>(list: T[], predicate: (entry: T) => boolean) {
        for (const entry of list) {
            if (predicate(entry)) {
                return true;
            }
        }
        return false;
    }

    private nextRandomNumberBetween(minimum: number, maximum: number, rng: Rand): number {
        const min = Math.ceil(minimum);
        const max = Math.floor(maximum);
        return Math.floor(rng.next() * (max - min + 1)) + min;
    }
}

export {
    MinesweeperGame,
    BoardTile,
};
