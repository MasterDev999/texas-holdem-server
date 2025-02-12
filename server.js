const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server running on ws://localhost:8080');

let games = {}; // Stores game sessions by team code

server.on('connection', (ws) => {
    console.log('New player connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'join') {
            const { teamCode, playerName } = data;
            
            if (!games[teamCode]) {
                games[teamCode] = { players: [], state: {} };
            }
            
            games[teamCode].players.push({ name: playerName, ws });
            console.log(`${playerName} joined team ${teamCode}`);
            
            // Notify all players in the team
            broadcast(teamCode, { type: 'player_joined', playerName });
        }
        
        if (data.type === 'game_action') {
            const { teamCode, action } = data;
            
            // Update game state (basic for now)
            games[teamCode].state = { ...games[teamCode].state, action };
            
            // Broadcast the action to all team members
            broadcast(teamCode, { type: 'game_update', action });
        }
    });

    ws.on('close', () => {
        console.log('Player disconnected');
    });
});

function broadcast(teamCode, message) {
    if (games[teamCode]) {
        games[teamCode].players.forEach(player => {
            player.ws.send(JSON.stringify(message));
        });
    }
}
