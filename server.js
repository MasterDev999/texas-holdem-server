const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server running on ws://localhost:8080');

let games = {}; // Stores game sessions by team code

server.on('connection', (ws) => {
    console.log('New player connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        // Handle team creation
        if (data.type === 'create_team') {
            const { teamCode } = data;

            // If the team already exists, reject the request
            if (games[teamCode]) {
                ws.send(JSON.stringify({ type: 'error', message: 'Team code already exists.' }));
                return;
            }

            // Create the team with an empty player list
            games[teamCode] = { players: [], state: {} };
            console.log(`Team ${teamCode} created`);

            // Notify the player who created the team
            ws.send(JSON.stringify({ type: 'team_created', teamCode }));
        }

        // Handle joining a team
        if (data.type === 'join') {
            const { teamCode, playerName } = data;

            // If the team does not exist, reject the request
            if (!games[teamCode]) {
                ws.send(JSON.stringify({ type: 'error', message: 'Team code does not exist.' }));
                return;
            }

            // Add the player to the team
            games[teamCode].players.push({ name: playerName, ws });
            console.log(`${playerName} joined team ${teamCode}`);

            // Notify all players in the team that a new player joined
            broadcast(teamCode, { type: 'player_joined', playerName });
        }

        // Handle game actions (e.g., making a move)
        if (data.type === 'game_action') {
            const { teamCode, action } = data;

            // Update the game state with the action
            games[teamCode].state = { ...games[teamCode].state, action };

            // Broadcast the action to all players in the team
            broadcast(teamCode, { type: 'game_update', action });
        }
    });

    ws.on('close', () => {
        console.log('Player disconnected');
    });
});

// Function to broadcast a message to all players in the team
function broadcast(teamCode, message) {
    if (games[teamCode]) {
        games[teamCode].players.forEach(player => {
            player.ws.send(JSON.stringify(message));
        });
    }
}
