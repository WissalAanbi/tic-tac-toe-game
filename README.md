# Tic-Tac-Toe Server

Tic-tac-toe where every move is a link. The whole game state (board, current player, scores) lives in the URL, and a small Node.js HTTP server, written without a web framework, renders each page as HTML.

## Features

- Static file server with MIME types and 404/500 handling
- Game URLs of the form `/ttt/<board>/<player>?scoreX=..&scoreO=..&scoreT=..`, where the board is nine characters (`_` for an empty cell)
- Every free cell is rendered as a link to the next state; finished games render without links
- Running score for X, O and ties
- The winning triplet is highlighted on the board
- The player who lost starts the next game
- Tamper protection: the URL carries a checksum, and an altered URL shows an error and a board without links
- Optional single-player mode (`mode=ai`): after your move the server redirects to the state reached after a random computer move

## Run it

```
npm install
npm start
```

Then open http://localhost:8888.

## Structure

```
index.js                  HTTP server, routing, static files
modules/script.js         board parsing, win/tie detection
modules/play-ttt-game.js  HTML rendering, checksum, game flow
public/                   static page and stylesheet
```
