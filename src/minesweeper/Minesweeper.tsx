import { observer } from 'mobx-react';
import classNames from 'classnames';
import { MinesweeperGame, BoardTile } from './minesweeper';
import './Minesweeper.css';
import { SyntheticEvent } from 'react';

function Minesweeper() {
    const width = 20;
    const height = 20;
    const bombs = Math.floor(width * height * 0.12);
    const game = new MinesweeperGame(width, height, bombs);
    const rowCount = game.board.length;
    const columnCount = game.board[0].length;
    const tileSize = 24;

    const parseTileCoordinates = (tile: EventTarget & Element): [number, number] => {
        const x = parseInt(tile.getAttribute('data-x') ?? '-1');
        const y = parseInt(tile.getAttribute('data-y') ?? '-1');
        return [x, y];
    }

    const handleTileClick = (event: SyntheticEvent) => {
        event.preventDefault();
        const [x, y] = parseTileCoordinates(event.currentTarget);
        game.click(x, y);
    }

    const handleFlagPlace = (event: SyntheticEvent) => {
        event.preventDefault();
        const [x, y] = parseTileCoordinates(event.currentTarget);
        game.flag(x, y);
    }

    const disableContextMenu = (event: SyntheticEvent) => {
        if (event.type = 'contextmenu') {
            event.preventDefault();
        }
    }

    const boardTileStyle = {
        cursor: 'pointer',
        width: `${tileSize}px`,
        height: `${tileSize}px`,
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
                            onContextMenu={handleFlagPlace}
                            style={boardTileStyle}
                            className={classNames({
                                'board-tile': true,
                                'tile-hidden': !tile.isVisible,
                                'tile-visible': tile.isVisible && !tile.isBomb,
                                'tile-bomb': tile.isVisible && tile.isBomb
                            })}
                        >
                            {
                                tile.isVisible
                                    ? tile.isBomb
                                        ? 'B'
                                        : tile.adjacentBombCount > 0
                                            ? tile.adjacentBombCount
                                            : ''
                                    : tile.isFlagged
                                        ? 'F'
                                        : ''
                            }
                        </div>
                    ))
                }
            </>
        }
    );

    const GameActionsComponent = <>
        <div>

        </div>
    </>;

    const gameBoardStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${rowCount}, 1fr)`,
        gridTemplateRows: `repeat(${columnCount}, 1fr)`,
        columnGap: '2px',
        rowGap: '2px',
        justifyItems: 'center',
        width: `${(tileSize + 2) * width - 2}px`,
        backgroundColor: 'whitesmoke',
        border: '2px solid black',
        padding: '2px',
    }

    return (
        <div className="minesweeper">
            <div className='game-board' style={gameBoardStyle} onContextMenu={disableContextMenu}>
                <GameBoardComponent gameBoard={game.board} />
            </div>
        </div>
    );
}

export default Minesweeper;
