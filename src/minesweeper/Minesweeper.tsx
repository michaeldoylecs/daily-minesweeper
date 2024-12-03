import { observer } from 'mobx-react';
import classNames from 'classnames';
import { MinesweeperGame, MinesweeperGameState, BoardTile } from './minesweeper-game';
import './Minesweeper.css';
import { SyntheticEvent, useEffect, useState } from 'react';
import { action, autorun } from 'mobx';

function SerializeGameState(gamestate: MinesweeperGameState): string {
    return JSON.stringify(gamestate);
}

function DeserializeGameState(gamestate: string): MinesweeperGameState {
    return JSON.parse(gamestate);
}

function getTodaysSeed(): string {
    const MAGIC_NUMBER = 329246;
    const now = new Date();
    const seed = (now.getUTCDay() * now.getUTCMonth() * now.getUTCFullYear() * MAGIC_NUMBER).toString();
    return seed
}

function Minesweeper() {
    const width = 20;
    const height = 20;
    const bombs = Math.floor(width * height * 0.12);
    const [game] = useState(() => {
        const todaySeed = getTodaysSeed();

        const old = localStorage.getItem("gamestate");
        if (old == null) {
            return new MinesweeperGame(width, height, bombs, todaySeed);
        }

        const gamestate = DeserializeGameState(old);
        if (gamestate.Seed == todaySeed) {
            console.log("Loaded gamestate");
            return MinesweeperGame.Load(gamestate);
        }

        return new MinesweeperGame(width, height, bombs, todaySeed);
    });
    const rowCount = game.board.length;
    const columnCount = game.board[0].length;

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
        if (event.type == 'contextmenu') {
            event.preventDefault();
        }
    }

    // Save game state on change
    useEffect(() => {
        const disposer = autorun(() => {
            const gamestate = game.Export();
            localStorage.setItem("gamestate", SerializeGameState(gamestate));
            console.log("Saved gamestate");
        });
        return () => disposer();
    }, [])

    const boardTileStyle = {
        cursor: 'pointer',
        justifySelf: 'stretch',
    }

    const GameBoardComponent = observer((observable: { game: MinesweeperGame }) => 
        {
            const gameBoard = observable.game.board;
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
                                'tile-bomb': tile.isVisible && tile.isBomb,
                                'tile-flag': tile.isFlagged,
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

    const gameBoardStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${rowCount}, 1fr)`,
        gridTemplateRows: `repeat(${columnCount}, 1fr)`,
        columnGap: '2px',
        rowGap: '2px',
        justifyItems: 'center',
        minWidth: `500px`,
        minHeight: `500px`,
        width: `70vh`,
        height: `70vh`,
        maxWidth: `70vw`,
        maxHeight: `70vw`,
        backgroundColor: 'whitesmoke',
        border: '2px solid black',
        padding: '2px',
    }

    return (
        <div className="minesweeper">
            <ResetClock />
            <div className='game-board' style={gameBoardStyle} onContextMenu={disableContextMenu}>
                <GameBoardComponent game={game} />
            </div>
        </div>
    );
}

function ResetClock() {
    const [currentDate, setCurrentDate] = useState(() => new Date())

    useEffect(() => {
        const handle = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000);
        return () => {
            clearInterval(handle);
        }
    })

    const resetDateTime = new Date(Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate() + 1,
    ));
    const sec = (resetDateTime.getTime() - currentDate.getTime()) / 1000;
    const seconds = Math.floor(sec % 60).toString().padStart(2, '0');
    const minutes = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const hours = Math.floor(sec / 3600).toString().padStart(2, '0');

    return (
        <div className="reset-clock">
            <span>Next: </span>
            <span className="clock-numbers">{hours}:{minutes}:{seconds}</span>
        </div>
    );
}

export default Minesweeper;
