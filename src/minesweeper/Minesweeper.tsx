import { observer } from 'mobx-react';
import { MinesweeperGame, BoardTile } from './minesweeper';

function Minesweeper() {
    const game = new MinesweeperGame();
    const rowCount = game.board.length;
    const columnCount = game.board[0].length;
    const GameBoardComponent = observer((observable: { gameBoard: BoardTile[][] }) => 
        {
            const { gameBoard } = observable;
            return <>
                {
                    gameBoard.map((row) => row.map((tile, i) =>
                        <div className='board-tile' key={i}>
                            { tile.isBomb ? 'B' : tile.adjacentBombCount }
                        </div>
                    ))
                }
            </>
        }
    );

    const gameBoardStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${rowCount}, 1fr)`,
        gridTemplateRows: `repeat(${columnCount}, 1fr)`,
        columnGap: '5px',
        rowGap: '5px',
    }

    return (
        <div className="Minesweeper">
            <div className='game-board' style={gameBoardStyle}>
                <GameBoardComponent gameBoard={game.board} />
            </div>
        </div>
    );
}

export default Minesweeper;
