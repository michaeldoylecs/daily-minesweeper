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
        makeAutoObservable(this);
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
    private isOver: boolean;

    constructor(boardWidth: number = 9, boardHeight: number = 9, mineCount: number = 12) {
        makeAutoObservable(this);
        this._board = this.createEmptyBoard(boardWidth, boardHeight);
        this.boardRows = this._board.length;
        this.boardColumns = this._board[0].length; // Assumes board > 0 rows
        this.mineCount = mineCount;
        this._board = this.generateGameBoard();
        this.isOver = false;
    }

    public click(x: number, y: number) {
        if (this.isOver) return;
        if (x < 0 || x >= this.boardColumns || y < 0 || y > this.boardRows) return;
        const tile = this._board[x][y];
        if (tile.isVisible) return;
        this._board[x][y].isVisible = true;
        if (tile.isBomb) {
            this.isOver = true;
            return;
        }
        if (tile.adjacentBombCount === 0) {
            this._board = this.propagateEmptyTiles(this._board, x, y);
            console.log(this._board);
        }
    }

    public flag(x: number, y: number) {
        if (this.isOver) return;
        if (x < 0 || x >= this.boardColumns || y < 0 || y > this.boardRows) return;
        const tile = this._board[x][y];
        if (tile.isVisible) return;
        this._board[x][y].isFlagged = !this._board[x][y].isFlagged;
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

    private propagateEmptyTiles(board: BoardTile[][], x: number, y: number): BoardTile[][] {
        const visitedCoords = new Set<string>();
        let toVisit = this.getAdjacentTiles(board, x, y);
        console.log(`toVisit: ${toVisit}`)

        while (toVisit.length > 0) {
            const [currX, currY] = toVisit.pop()!;
            const stringifiedCoords = JSON.stringify([currX, currY]);
            if (visitedCoords.has(stringifiedCoords)) {
                continue;
            }
            visitedCoords.add(stringifiedCoords);
            board[currX][currY].isVisible = true;
            if (board[currX][currY].adjacentBombCount === 0) {
                const adjacentTiles = this.getAdjacentTiles(board, currX, currY);
                toVisit = toVisit.concat(adjacentTiles);
            }
        }
        return board;
    }

    private incrementAdjacentTiles(board: BoardTile[][], x: number, y: number): BoardTile[][] {
        const adjacentTiles = this.getAdjacentTiles(board, x, y);
        for (const adjTile of adjacentTiles) {
            const [x, y] = adjTile;
            board[x][y].adjacentBombCount += 1;
        }
        return board;
    }

    private getAdjacentTiles(board: BoardTile[][], x: number, y: number): [number, number][] {
        if (board.length < 1) {
            return [];
        }
        const xMax = board.length;
        const yMax = board[0].length;
        
        const NW = [-1, -1];
        const N  = [ 0, -1];
        const NE = [ 1, -1];
        const E  = [ 1,  0];
        const SE = [ 1,  1];
        const S  = [ 0,  1];
        const SW = [-1,  1];
        const W  = [-1,  0];
        const adjacencies = [NW, N, NE, E, SE, S, SW, W];
        const validAdjacencies: [number, number][] = [];
        for (const adjacency of adjacencies) {
            const [dx, dy] = adjacency;
            const adjX = x + dx;
            const adjY = y + dy;
            if (adjX < 0 || adjX >= xMax || adjY < 0 || adjY >= yMax) {
                continue;
            }
            validAdjacencies.push([adjX, adjY]);
        }
        return validAdjacencies;
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
