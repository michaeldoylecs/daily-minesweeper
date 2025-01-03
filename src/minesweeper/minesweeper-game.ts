import Rand from 'rand-seed'; 
import { makeAutoObservable } from 'mobx';

export class BoardTile {
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

export interface MinesweeperGameState {
    BoardRows: number;
    BoardColumns: number;
    BoardData: BoardTile[][];
    MineCount: number;
    Seed: string;
    isOver: boolean;
}

export class MinesweeperGame {
    readonly mineCount: number;
    readonly boardRows: number;
    readonly boardColumns: number;
    readonly seed: string = 'TESTSEED';
    private _board: BoardTile[][];
    private _isOver: boolean;

    constructor(
        boardWidth: number = 9,
        boardHeight: number = 9,
        mineCount: number = 12,
        seed: string = 'TESTSEED',
        isOver: boolean = false
    ) {
        this._board = this.createEmptyBoard(boardWidth, boardHeight);
        this.boardRows = this._board.length;
        this.boardColumns = this._board[0].length; // Assumes board > 0 rows
        this.mineCount = mineCount;
        this.seed = seed;
        this._board = this.generateGameBoard();
        this._isOver = isOver;
        makeAutoObservable(this);
    }

    public static Load(gamestate: MinesweeperGameState): MinesweeperGame {
        let game = new MinesweeperGame(
            gamestate.BoardColumns,
            gamestate.BoardRows,
            gamestate.MineCount,
            gamestate.Seed,
            gamestate.isOver
        );
        for (let r = 0; r < game.boardRows; ++r) {
            for (let c = 0; c < game.boardColumns; ++c) {
                game._board[r][c] = gamestate.BoardData[r][c];
            }
        }
        return game;
    }

    public Export(): MinesweeperGameState {
        return {
            BoardRows: this.boardRows,
            BoardColumns: this.boardColumns,
            BoardData: this._board.slice(),
            MineCount: this.mineCount,
            Seed: this.seed,
            isOver: this._isOver,
        };
    }

    public reset() {
        this._board = this.generateGameBoard();
        this._isOver = false;
    }

    public click(x: number, y: number) {
        // Prevent click if game is already over
        if (this._isOver) return;

        // Prevent click outside of game bounds
        if (x < 0 || x >= this.boardColumns || y < 0 || y > this.boardRows) return;

        const tile = this._board[x][y];
        
        if (tile.isVisible) {
            // If a revealed, non-flagged, number number tile was clicked...
            if (!tile.isBomb && !tile.isFlagged && tile.adjacentBombCount > 0 && this.getAdjacentFlagCount(this._board, x, y) == tile.adjacentBombCount) {
                this.revealHiddenNonflaggedNeighbors(this._board, x, y);
            } else {
                return;
            }
        } else {
            // Reveal the tile if not revealed yet
            this._board[x][y].isVisible = true;
        }

        // If a bomb was clicked, end the game
        if (tile.isBomb) {
            this._isOver = true;
            return;
        }

        // If there are no adjacnet bombs, propagate out the revealed tiles.
        if (tile.adjacentBombCount === 0) {
            this._board = this.propagateEmptyTiles(this._board, x, y);
        }

        console.log("Checking win...");
        if (this.isWin()) {
            console.log("...game is won!");
            this._isOver = true;
        }
    }

    public flag(x: number, y: number) {
        if (this._isOver) return;
        if (x < 0 || x >= this.boardColumns || y < 0 || y > this.boardRows) return;
        const tile = this._board[x][y];
        if (tile.isVisible) return;
        this._board[x][y].isFlagged = !this._board[x][y].isFlagged;

        if (this._board[x][y].isFlagged) {
            console.log("Checking win...");
            if (this.isWin()) {
                console.log("...game is won!");
                this._isOver = true;
            }
        }
    }

    public get board(): BoardTile[][] { 
        return this._board;
    }

    private set board(newBoard) {
        this._board = newBoard;
        return;
    }

    public get isOver(): boolean {
        return this._isOver;
    }

    public isWin(): boolean {
        for (let j = 0; j < this.boardRows; ++j) {
            for (let k = 0; k < this.boardColumns; ++k) {
                const tile = this._board[j][k];
                if (!tile.isBomb && !tile.isVisible) {
                    return false;
                }
                if (tile.isBomb && !tile.isFlagged) {
                    return false;
                }
            }
        }
        return true;
    }

    private clickWithoutEnding(board: BoardTile[][],x: number, y: number): number {
        // Prevent click if game is already over
        if (this._isOver) return 0;

        // Prevent click outside of game bounds
        if (x < 0 || x >= this.boardColumns || y < 0 || y > this.boardRows) return 0;

        const tile = this._board[x][y];
        
        if (tile.isVisible) {
            // Ignore revealed tiles
            return 0;
        } else {
            // Reveal the tile if not revealed yet
            this._board[x][y].isVisible = true;
        }

        // If a bomb was clicked, end the game
        if (tile.isBomb) {
            this._isOver = true;
            return 1;
        }

        // If there are no adjacent bombs, propagate out the revealed tiles.
        if (tile.adjacentBombCount === 0) {
            this._board = this.propagateEmptyTiles(this._board, x, y);
        }

        return 0;
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
        let rng = new Rand(this.seed);
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

        while (toVisit.length > 0) {
            const [currX, currY] = toVisit.pop()!;

            // Check if already visited
            const stringifiedCoords = JSON.stringify([currX, currY]);
            if (visitedCoords.has(stringifiedCoords)) {
                continue;
            }
            visitedCoords.add(stringifiedCoords);
            
            // Reveal tile
            board[currX][currY].isVisible = true;
            
            // If the tile has no adjacent bomb, add neighbor tiles to toVisit list
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

    private getAdjacentFlagCount(board: BoardTile[][], x: number, y: number): number {
        let flags = 0;

        for (let [x1, y1] of this.getAdjacentTiles(board, x, y)) {
            const tile = board[x1][y1];
            if (tile.isFlagged) {
                flags += 1;
            }
        }

        return flags;
    }

    private revealHiddenNonflaggedNeighbors(board: BoardTile[][], x: number, y: number) {
        let bombCount = 0;
        for (let [x1, y1] of this.getAdjacentTiles(board, x, y)) {
            if (board[x1][y1].isVisible || board[x1][y1].isFlagged) {
                continue;
            }
            bombCount += this.clickWithoutEnding(board, x1, y1);
        }
        if (bombCount > 0) {
            this._isOver = true;
        }
    }
}
