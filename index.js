const path = require("path");

const http = require("http");

const fs = require("fs-extra");

let site_path = "./public";

const tictactoe = require("./modules/play-ttt-game");

let content_types = {
    "html": "text/html",
    "css": "text/css",
    "js": "application/javascript",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "ico": "image/x-icon",
    "svg": "image/svg+xml",
    "json": "application/json",
    "pdf": "application/pdf",
    "zip": "application/zip",
    "csv": "text/csv",
    "txt": "text/plain",
    "ttf": "font/ttf",
}

function sendFile(urlpath, response) {

    const localPath = path.join(process.cwd(), site_path, decodeURI(urlpath));

    const file = fs.createReadStream(localPath);

    file.on('error', function (err) {
        switch (err.code) {
            case 'ENOENT':
                console.log(`File ${localPath} does not exist.`);

                response.writeHead(404);
                response.end();
                break;
            case 'EISDIR':

                response.writeHead(401);
                response.end();
                break;
            default:
                console.log('Error: ' + err);
                throw err;
        }
        return;
    });

    file.on('open', function () {

        let header = {};

        const ext = localPath.split('.').pop().toLowerCase();

        header['Content-Type'] = content_types[ext] || 'text/plain';

        response.writeHead(200, header);

    file.pipe(response);

    });
}

function onrequest(request, response) {

  let url = new URL(request.url, "http://localhost:8888/");

    const pathname = url.pathname;

const isAi = url.searchParams.get('mode') === 'ai';

    console.log(request.method, pathname);

    const filePath = path.join(process.cwd(), site_path, pathname);

    if(fs.existsSync(filePath) && fs.statSync(filePath).isFile()){
        sendFile(pathname, response);
        return;
    }

    if (pathname === "/") {

        response.writeHead(302, { 'Location': '/ttt/_________?scoreX=0&scoreO=0&scoreT=0' });
        response.end();
        return;
    }

    if (pathname.startsWith('/ttt/')){

        const rawPath = pathname.substring(5);
        const parts = rawPath.split('/');

        const board = parts[0] || '_________';

        let player = (parts[1] && parts[1].length > 0) ? parts[1] : 'o';
        player = player.toLowerCase();

        const clientChecksum = url.searchParams.get('checksum');
        let isTampered = false;

        if (board !== '_________' && clientChecksum){
            const expectedChecksum = tictactoe.generateChecksum(board, player);
            if (clientChecksum !== expectedChecksum){
                isTampered = true;
            }
        }

        const hasScore = url.searchParams.has('scoreX') || url.searchParams.has('scoreO') || url.searchParams.has('scoreT');

        let scoreX = url.searchParams.get('scoreX');
        let scoreO = url.searchParams.get('scoreO');
        let scoreT = url.searchParams.get('scoreT');

       scoreX = scoreX !== null ? parseInt(scoreX, 10) : 0;
       scoreO = scoreO !== null ? parseInt(scoreO, 10) : 0;
       scoreT = scoreT !== null ? parseInt(scoreT, 10) : 0;

        if (isAi && player === 'o'){
            const boardMatrix = tictactoe.parse(board);
            const winner = tictactoe.getWinner(boardMatrix);

            if (winner === '' && board.includes('_')){
                let emptyIndeces = [];
                for (let i = 0; i < board.length; i++){
                    if (board[i] === '_') {
                        emptyIndeces.push(i);
                    }
                }
                if (emptyIndeces.length > 0) {
                    const randomIndex = emptyIndeces[Math.floor( Math.random() * emptyIndeces.length)];

                    const aiBoard = board.substring(0, randomIndex) + 'O' + board.substring(randomIndex + 1);
                    const nextP = 'x';

                    const checksum = tictactoe.generateChecksum(aiBoard, nextP);

                    let queryParams = [];
                    if (hasScore || scoreO > 0 || scoreT > 0 || scoreX > 0) {
                        queryParams.push(`scoreX=${scoreX}&scoreO=${scoreO}&scoreT=${scoreT}`);
                    }
                    queryParams.push(`mode=ai`);
                    queryParams.push(`checksum=${checksum}`);
                    const redirectQuery = `?${queryParams.join('&')}`;

                    response.writeHead(302, { 'Location': `/ttt/${aiBoard}/${nextP}${redirectQuery}` });
                    response.end();
                    return;
                }

            }

        }

       const html =tictactoe.render(board, player, scoreX, scoreO, scoreT, hasScore, isTampered, isAi);
        response.writeHead(200, { 'Content-Type': 'text/html'});
        response.end(html);
        return;
    }

        response.writeHead(404);
        response.end();
}

const server = http.createServer(onrequest);
server.listen(8888);

module.exports = server;
