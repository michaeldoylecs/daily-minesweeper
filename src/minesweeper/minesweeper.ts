// import { prng_alea } from 'esm-seedrandom'; 

class BoardTile {
    readonly isVisible: boolean;
    readonly isFlagged: boolean;
    readonly isBomb: boolean; 

    constructor(
        isVisible: boolean = false,
        isFlagged: boolean = false,
        isBomb: boolean = false)
        {
            this.isVisible = isVisible;
            this.isFlagged = isFlagged;
            this.isBomb = isBomb;
        }
}

class MinesweeperGame {
    private _board: BoardTile[][];
//  private _seed: string = 'TESTSEED';

    constructor(boardWidth: number = 9, boardHeight: number = 9) {
        this._board = this.createEmptyBoard(boardWidth, boardHeight);
    }

    // public generateGameBoard() {
    //     let rng = prng_alea(this._seed);
    // }

    public get board(): BoardTile[][] { 
        return this._board;
    }

    private set board(newBoard) {
        this._board = newBoard;
        return;
    }

    private createEmptyBoard(width: number, height: number): BoardTile[][] {
        return Array(width).fill(Array(height).fill(new BoardTile()));
    }
}

export {
    MinesweeperGame,
    BoardTile,
};