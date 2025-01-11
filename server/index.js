const express = require('express');
const { createServer } = require('http');
const { Server } = require("socket.io");
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));
const httpServer = createServer(app);

const io = new Server(httpServer);

const loadMap = require('./mapLoader');

const users = {
    "user1": "password1"
};

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'login.html'));
});

app.get('/soccer', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

app.post('/login', (req, res) => {
    console.log('Received body:', req.body);
    const { username, password } = req.body;
    if (users[username] === password) {
        res.json({ success: true, message: "Login successful!" });
    } else {
        res.json({ success: false, message: "Invalid username or password" });
    }
});


app.use(bodyParser.json());

const TICK_RATE = 30;
const SPEED = 5;
const TILE_SIZE = 16;

let players = [];
const inputsMap = {};

let ball = {
    x: 800,
    y: 400,
    vx: 0,
    vy: 0,
    radius: 12
};

const BALL_MAX_X = 1500;
const BALL_MAX_Y = 750;

function tick() {
    for (const player of players) {
        const inputs = inputsMap[player.id];
        if (inputs.up) {
            player.y -= SPEED;
        } else if (inputs.down) {
            player.y += SPEED;
        }
        if (inputs.left) {
            player.x -= SPEED;
        } else if (inputs.right) {
            player.x += SPEED;
        }
        player.x = Math.max(0, Math.min(player.x, 1550));
        player.y = Math.max(0, Math.min(player.y, 760));
    }

    for (const player of players) {
        const dx = ball.x - player.x;
        const dy = ball.y - player.y;
        const distance = Math.hypot(dx, dy);
        if (distance < ball.radius + TILE_SIZE) {
            const angle = Math.atan2(dy, dx);
            const speed = 5;
            ball.vx = Math.cos(angle) * speed;
            ball.vy = Math.sin(angle) * speed;
        }
    }

    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= 0.99;
    ball.vy *= 0.99;
    ball.x = Math.max(ball.radius, Math.min(ball.x, BALL_MAX_X));
    ball.y = Math.max(ball.radius, Math.min(ball.y, BALL_MAX_Y));
    io.emit("players", players);
    io.emit('ball', ball);
}

async function main() {
    const map2D = await loadMap();

    io.on('connect', (socket) => {
        console.log("user connected", socket.id);
        inputsMap[socket.id] = {
            up: false,
            down: false,
            left: false,
            right: false
        };
    
        players.push({
            id: socket.id,
            x: 0,
            y: 0
        });
    
        socket.emit("map", map2D);
        socket.emit("ball", ball);
    
        socket.on('inputs', (inputs) => {
            inputsMap[socket.id] = inputs[socket.id] || {
                up: false,
                down: false,
                left: false,
                right: false
            };
        });
    
        socket.on('ball', (velocity) => {
            ball.vx = velocity.vx;
            ball.vy = velocity.vy;
        });
        
        socket.on("disconnect", () => {
            players = players.filter((player) => player.id !== socket.id);
        });
    });

    app.use(express.static("public"));

    httpServer.listen(3000);

    setInterval(tick, 1000 / TICK_RATE);
}

main();
