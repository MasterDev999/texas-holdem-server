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

            // Start the game if there are 2 players
            if (games[teamCode].players.length === 2) {
                startGame(teamCode);
            }
        }

        if (data.type === 'game_action') {
            const { teamCode, action } = data;
            handleGameAction(teamCode, action);
        }
    });

    ws.on('close', () => {
        console.log('Player disconnected');
    });
});

// Start the game
function startGame(teamCode) {
    const game = games[teamCode];
    game.state.deck = createDeck();
    shuffleDeck(game.state.deck);
    dealCards(game.players);

    broadcast(teamCode, { type: 'game_started', state: game.state });
}

// Create a deck of cards
function createDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];

    for (let suit of suits) {
        for (let value of values) {
            deck.push(`${value} of ${suit}`);
        }
    }
    return deck;
}

// Shuffle the deck
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// Deal cards to players
function dealCards(players) {
    players.forEach(player => {
        player.cards = [game.state.deck.pop(), game.state.deck.pop()];
    });
}

// Handle player game actions (e.g., bet, fold)
function handleGameAction(teamCode, action) {
    console.log(`Player performed action: ${action}`);
    broadcast(teamCode, { type: 'game_action', action });
}

// Broadcast message to all players in the game
function broadcast(teamCode, message) {
    if (games[teamCode]) {
        games[teamCode].players.forEach(player => {
            player.ws.send(JSON.stringify(message));
        });
    }
}
