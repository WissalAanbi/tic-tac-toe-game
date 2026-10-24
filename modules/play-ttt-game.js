const crypto = require('crypto');

const LILY = 'always';

const script = require('./script');
const checksum = require('checksum');

const parse = script.tttParse;
const getWinner = script.tttGetWinner;
const check = script.tttCheck;
const isGameOver = script.tttIsGameOver;

const getWinningIndices = script.tttGetWinningIndices;

module.exports = {
    parse,
    getWinner,
    check,
    isGameOver,
    render,
    generateChecksum
};

function generateChecksum (board, player) {
    const data = `${board}:${player}`;
    return checksum(data, { secret: LILY});
}

function makeMove(board, index, symbol){
    return board.substring(0, index) + symbol + board.substring(index + 1);
}

function getNextPlayer(currentPlayer){
    const current = currentPlayer.toLowerCase();
    return current === 'o' ? 'x' : 'o';
}

function render(board,player,scoreX,scoreO,scoreT, hasScore, isTampered, isAi){
    player = (player || 'o').toLowerCase();

    const boardMatrix = parse(board);
    const winner = getWinner(boardMatrix);
    const gameOver = winner !== "" || isTampered;

    let bodyClass = "";
    let statusMessage = "";

    if (isTampered) {
        bodyClass = "error";
        statusMessage = "Error: URL tempered!";
    }
    else if (winner === "tie") {
        scoreT++;
        bodyClass = "tie";
        statusMessage = "tie";
    } else if (winner === "X" || winner === "O") {
        if (winner === "X") scoreX++; else scoreO++;
        bodyClass = "win";
        statusMessage = `${winner} wins`;
    }

    let nextStartingPlayer;

    if (winner === "X") {
        nextStartingPlayer = "o";
    } else if (winner === "O") {
        nextStartingPlayer = "x";
    } else {
        nextStartingPlayer = player === "x" ? "o" : "x";
    }

    const nextPlayer = getNextPlayer(player).toLowerCase();

    let queryParams = [];
    if (hasScore || scoreO > 0 || scoreT > 0 || scoreX > 0) {
        queryParams.push(`scoreX=${scoreX}&scoreO=${scoreO}&scoreT=${scoreT}`);
    }

    if (isAi) {
        queryParams.push(`mode=ai`);
    }

    const scoreQuery = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    let boardHtml = '';

    const winningIndices = getWinningIndices(boardMatrix);

    for(let i = 0; i < board.length; i++){
        const cell = board[i];

        const isWinningCell = winningIndices.includes(i);

        const cellClass = isWinningCell ? "cell win-cell" : "cell";

        if (cell === '_' && !gameOver && !isTampered){

            const newBoard = makeMove(board, i, player.toUpperCase());

            const checksum = generateChecksum(newBoard, nextPlayer);

            const separator = scoreQuery ? '&' : '?';
            const moveUrl = `/ttt/${newBoard}/${nextPlayer}${scoreQuery}${separator}checksum=${checksum}`;

            boardHtml += `<a href="${moveUrl}" class="${cellClass} empty"><b>_</b></a>`;
        } else {

            boardHtml += `<div class="${cellClass}"><b>${cell}</b></div>`;
        }
    }

     return `<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>Tic-Tac-Toe</title>
        <link rel="stylesheet" href="/css/play-tictactoe-game.css">   
    </head>
    <body class="${bodyClass}">                                        
        <main>
            <header>
                <p class="scoreX">Player X: <span>${scoreX}</span></p> 
                <p class="scoreO">Player O: <span>${scoreO}</span></p>
                <p class="scoreT">Ties: <span>${scoreT}</span></p>
            </header>


            <nav>
                <a href="/ttt/_________?scoreX=0&scoreO=0&scoreT=0">Reset</a>
                <a href="/ttt/_________/${nextStartingPlayer}?scoreX=${scoreX}&scoreO=${scoreO}&scoreT=${scoreT}">Continue</a>
                <!-- bottone AI -->
                <a href="/ttt/_________?mode=ai&scoreX=${scoreX}&scoreO=${scoreO}&scoreT=${scoreT}">Play vs AI</a>
            </nav>


            <section class="message">${statusMessage}</section>

            <section class="grid" id="board">
                ${boardHtml}
            </section>
        </main>
    </body>
</html>`;
}
