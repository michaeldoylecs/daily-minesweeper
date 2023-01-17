import { observer } from 'mobx-react';
import classNames from 'classnames';
import { MinesweeperGame, BoardTile } from './minesweeper';
import './Minesweeper.css';
import { SyntheticEvent } from 'react';

function Minesweeper() {
    const game = new MinesweeperGame();
    const rowCount = game.board.length;
    const columnCount = game.board[0].length;

    const handleTileClick = (event: SyntheticEvent) => {
        const x = parseInt(event.currentTarget.getAttribute('data-x') ?? '-1');
        const y = parseInt(event.currentTarget.getAttribute('data-y') ?? '-1');
        game.click(x, y);
    }

    const GameBoardComponent = observer((observable: { gameBoard: BoardTile[][] }) => 
        {
            const { gameBoard } = observable;
            return <>
                {
                    gameBoard.map((row, x) => row.map((tile, y) =>
                        <div
                            key={JSON.stringify([x, y])}
                            data-x={x}
                            data-y={y}
                            onClick={handleTileClick}
                            className={classNames({
                                'board-tile': true,
                                'tile-hidden': !tile.isVisible,
                                'tile-visible': tile.isVisible && !tile.isBomb,
                                'tile-bomb': tile.isVisible && tile.isBomb
                            })}
                        >
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
