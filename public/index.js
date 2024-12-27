const mapImage = new Image();
mapImage.src = "/groundGrass.png";

const catImage = new Image();
catImage.src = "/cat2.png";

const ballImage = new Image();
ballImage.src = '/ball.png';

const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;
const canvas = canvasEl.getContext("2d");

const socket = io('ws://localhost:3000');

let map = [[]];
let players = [];
let ball = { x: 800, y: 800, vx: 0, vy: 0 };  // Define ball object here

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
    if(e.key === "w"){
        inputs["up"] = true;
    } else if (e.key === "s"){
        inputs["down"] = true;
    } else if (e.key ==="d"){
        inputs["right"] = true;
    } else if (e.key === "a"){
        inputs["left"] = true;
    }
    socket.emit("inputs", inputs);
});

window.addEventListener("keyup", (e) => {
    if(e.key === "w"){
        inputs["up"] = false;
    } else if (e.key === "s"){
        inputs["down"] = false;
    } else if (e.key ==="d"){
        inputs["right"] = false;
    } else if (e.key === "a"){
        inputs["left"] = false;
    }
    socket.emit("inputs", inputs);
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

function loop() {
    canvas.clearRect(0, 0, canvasEl.width, canvasEl.height);
    
    const myPlayer = players.find((player) => player.id === socket.id);
    
    let cameraX = 0;
    let cameraY = 0;
    
    if (myPlayer) {
        cameraX = Math.max(0, Math.min(myPlayer.x - canvasEl.width / 2, map[0].length * TILE_SIZE - canvasEl.width)); 
        cameraY = Math.max(0, Math.min(myPlayer.y - canvasEl.height / 2, map.length * TILE_SIZE - canvasEl.height));
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
        canvas.drawImage(catImage, player.x - cameraX, player.y - cameraY);
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
