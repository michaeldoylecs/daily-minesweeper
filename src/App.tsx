import Minesweeper from './minesweeper/Minesweeper';
import './App.css'

function App() {
  return (
    <div className="app">
      <header>
        <h2>
          Daily Minesweeper
        </h2>
      </header>
      <main>
        <Minesweeper />
      </main>
      <footer>
        <a href="https://github.com/michaeldoylecs" target="_blank">
          <img src="github-mark.svg" width="20px" height="20px"></img>
          <span>Michael Doyle</span>
        </a>
      </footer>
    </div>
  )
}

export default App
