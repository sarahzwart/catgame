const express = require('express');
const { createServer } = require('http');
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer);

const loadMap = require('./mapLoader');

const TICK_RATE = 30;
const SPEED = 5;
const TILE_SIZE = 32;

let players = [];
const inputsMap = {};

let ball = {
    x: 800,
    y: 800,
    vx: 0,
    vy: 0,
    radius: 12
};

// Define the boundaries for the ball
const BALL_MAX_X = 1500;
const BALL_MAX_Y = 1500;

function tick() {
    // Update player positions
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

        // Keep players within boundaries
        player.x = Math.max(0, Math.min(player.x, 1550));
        player.y = Math.max(0, Math.min(player.y, 1550));
    }

    // Check collision with players and move the ball
    for (const player of players) {
        const dx = ball.x - player.x;
        const dy = ball.y - player.y;
        const distance = Math.hypot(dx, dy);

        // If the player is near the ball (within a radius), the ball moves in their direction
        if (distance < ball.radius + TILE_SIZE) {
            const angle = Math.atan2(dy, dx);
            const speed = 5;
            ball.vx = Math.cos(angle) * speed;
            ball.vy = Math.sin(angle) * speed;
        }
    }

    // Update ball position
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Apply friction to slow the ball down
    ball.vx *= 0.99;
    ball.vy *= 0.99;

    // Prevent the ball from going outside the boundaries
    ball.x = Math.max(ball.radius, Math.min(ball.x, BALL_MAX_X));
    ball.y = Math.max(ball.radius, Math.min(ball.y, BALL_MAX_Y));

    // Emit updated player and ball positions to all clients
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
            inputsMap[socket.id] = inputs;
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
