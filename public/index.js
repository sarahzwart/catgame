const mapImage = new Image();
mapImage.src = "/terrain.png"

const catImage = new Image();
catImage.src = "/cat2.png";

const ballImage = new Image();
ballImage.src = '/ball.png'

const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;
const canvas = canvasEl.getContext("2d");

const socket = io('ws://localhost:3000');

let map = [[]];
let players = [];

const TILE_SIZE = 16;


socket.on("connect", () => {
    console.log("connected")
    console.log(socket.id)
})

socket.on("map", (loadedMap) => {
    map = loadedMap
})

socket.on("players", (serverPlayers) => {
    players = serverPlayers
})

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
    socket.emit("inputs", inputs)
})

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
    socket.emit("inputs", inputs)
})

window.addEventListener('click', (e) => {
    socket.emit('ball', {
        x: e.clientX
    })
})

function loop() {
    canvas.clearRect(0,0, canvasEl.width, canvasEl.height);
    const myPlayer = players.find((player) => player.id === socket.id);
    let cameraX = 0;
    let cameraY = 0;
    if (myPlayer){
        cameraX = parseInt(myPlayer.x - canvasEl.width / 2);
        cameraY = parseInt(myPlayer.y - canvasEl.height / 2);
    }
    const TILES_IN_ROW = 64;

    for(let row = 0; row < map.length; row++){
        for(let col = 0; col < map[0].length; col++){
            const {id} = map[row][col];
            const imageRow = parseInt(id / TILES_IN_ROW);
            const imageCol = parseInt(id % TILES_IN_ROW);
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
    for(const player of players){
        canvas.drawImage(catImage, player.x - cameraX, player.y - cameraY);
    }
    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);