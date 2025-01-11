const mapImage = new Image();
mapImage.src = "../assets/groundGrass.png";

const catImage = new Image();
catImage.src = "../assets/cat.png";

const ballImage = new Image();
ballImage.src = '../assets/ball.png';

const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;
const canvas = canvasEl.getContext("2d");

const socket = io('ws://localhost:3000');

let map = [[]];
let players = [];
let ball = { x: 800, y: 800, vx: 0, vy: 0 }; 

const TILE_SIZE = 16;

socket.on("connect", () => {
    console.log("connected");
    console.log(socket.id);
});

socket.on("map", (loadedMap) => {
    map = loadedMap;
});

socket.on("players", (serverPlayers) => {
    players = serverPlayers;
});

socket.on("ball", (serverBall) => {
    ball = serverBall;  
});

const inputs = {
    up: false,
    down: false,
    left: false,
    right: false,
};

window.addEventListener("keydown", (e) => {
    const myPlayer = players.find(player => player.id === socket.id);
    if (!myPlayer) return;
    
    if (!inputs[myPlayer.id]) {
        inputs[myPlayer.id] = { up: false, down: false, left: false, right: false };
    }

    if (e.key === "w") {
        inputs[myPlayer.id]["up"] = true;
    } else if (e.key === "s") {
        inputs[myPlayer.id]["down"] = true;
    } else if (e.key === "d") {
        inputs[myPlayer.id]["right"] = true;
    } else if (e.key === "a") {
        inputs[myPlayer.id]["left"] = true;
    }

    socket.emit("inputs", inputs); 
});

window.addEventListener("keyup", (e) => {
    const myPlayer = players.find(player => player.id === socket.id);
    if (!myPlayer) return;

    if (!inputs[myPlayer.id]) {
        inputs[myPlayer.id] = { up: false, down: false, left: false, right: false };
    }

    if (e.key === "w") {
        inputs[myPlayer.id]["up"] = false;
    } else if (e.key === "s") {
        inputs[myPlayer.id]["down"] = false;
    } else if (e.key === "d") {
        inputs[myPlayer.id]["right"] = false;
    } else if (e.key === "a") {
        inputs[myPlayer.id]["left"] = false;
    }

    socket.emit("inputs", inputs); // Emit updated inputs
});


window.addEventListener('click', (e) => {
    const myPlayer = players.find(player => player.id === socket.id);
    if (!myPlayer) return;
    const ballDistance = Math.hypot(ball.x - myPlayer.x, ball.y - myPlayer.y);
    if (ballDistance < TILE_SIZE * 2) { 
        const angle = Math.atan2(e.clientY - myPlayer.y, e.clientX - myPlayer.x);
        const speed = 5; 
        socket.emit('ball', {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        });
    }
});

function getCatOrientation(player) {
    const frameWidth = 30;
    const frameHeight = 30;
    const playerInputs = inputs[player.id] || { up: false, down: false, left: false, right: false };
    
    if (playerInputs.right) {
        return { x: 0, y: 0, width: frameWidth, height: frameHeight }; 
    } else if (playerInputs.left) {
        return { x: 0, y: 95, width: frameWidth, height: frameHeight }; 
    }
    if (playerInputs.down) {
        return { x: 0, y: 63, width: frameWidth, height: frameHeight }; 
    } else if (playerInputs.up) {
        return { x: 0, y: 30, width: frameWidth, height: frameHeight }; 
    }
    return { x: 0, y: 0, width: frameWidth, height: frameHeight }; 
}



function loop() {
    canvas.clearRect(0, 0, canvasEl.width, canvasEl.height);
    
    const myPlayer = players.find((player) => player.id === socket.id);
    
    let cameraX = 0;
    let cameraY = 0;
    
    if (myPlayer) {
        // Calculate camera position based on player's position and map dimensions
        const mapWidth = map[0].length * TILE_SIZE;
        const mapHeight = map.length * TILE_SIZE;

        cameraX = Math.max(0, Math.min(myPlayer.x - canvasEl.width / 2, mapWidth - canvasEl.width)); 
        cameraY = Math.max(0, Math.min(myPlayer.y - canvasEl.height / 2, mapHeight - canvasEl.height));
    }
    
    const TILES_IN_ROW = 52;

    canvas.fillStyle = "#000";  
    canvas.fillRect(0, 0, canvasEl.width, canvasEl.height);
    
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[0].length; col++) {
            const { id } = map[row][col];
            const imageRow = Math.floor(id / TILES_IN_ROW);
            const imageCol = id % TILES_IN_ROW;
            canvas.drawImage(
                mapImage,
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE, 
                TILE_SIZE,
                col * TILE_SIZE - cameraX, 
                row * TILE_SIZE - cameraY, 
                TILE_SIZE, 
                TILE_SIZE
            );
        }
    }
    for (const player of players) {
        const catOrientation = getCatOrientation(player);
        canvas.drawImage(
            catImage,
            catOrientation.x, 
            catOrientation.y,
            catOrientation.width, 
            catOrientation.height, 
            player.x - cameraX, 
            player.y - cameraY, 
            48, 48  
        );
    }
    
    const ballRadius = 15; 
    canvas.drawImage(
        ballImage, 
        ball.x - cameraX, 
        ball.y - cameraY, 
        ballRadius * 2, 
        ballRadius * 2  
    );
    
    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);

window.addEventListener('resize', () => {
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
});