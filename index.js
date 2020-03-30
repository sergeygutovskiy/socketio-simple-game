var express = require('express');

const app = express();
var http = require('http').createServer(app);
app.use(express.urlencoded({ extended: true }));

var io = require('socket.io')(http);


var players = [];
var bullets = [];
var newPlayer = null;


app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});


app.get('/start', function(req, res){
	res.sendFile(__dirname + '/start.html');
});


app.post('/start', function(req, res){
	res.sendFile(__dirname + '/index.html');
	newPlayer = req.body;
});


io.on('connection', function(socket){
	console.log('a user connected');
	players.push({
		id: socket.id,
		pos: {x: 0, y: 0},
		speed: 0.4,
		name: newPlayer.name,
		color: newPlayer.color
	});
	socket.emit("player-connected", players[players.length - 1]);
	io.emit("game-log", newPlayer.name + " connected");

	socket.on("update", (data) => {
		players = players.map(player => {
			if (player.id == data.id) player = data;
			return player;
		});
		
		bullets = bullets.map((bul) => {
			bul.pos.x += bul.speed * bul.cos;
			bul.pos.y += bul.speed * bul.sin;
			return bul;
		});

		bullets = bullets.filter((bul) => {
			if (bul.pos.x + 15 > 800 || bul.pos.x < 0) return false;
			if (bul.pos.y + 15 > 500 || bul.pos.y < 0) return false;
			return true;
		});

		io.emit("someone-movement", {players: players, bullets: bullets});
	});

	socket.on("shoot", (data) => {
		bullets.push(data);		
	});

	socket.on('disconnect', function(){
		console.log('user disconnected');

		players = players.filter((player) => {
			if (player.id == socket.id) {
				io.emit("game-log", player.name + " disconnected :(");
				return false;
			}
			return true;
		});
	});
});


http.listen(process.env.PORT || 3000, function(){
	console.log('listening on ' + (process.env.PORT || 3000));
});