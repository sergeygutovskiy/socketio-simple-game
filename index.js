var express = require('express');

const app = express();
var http = require('http').createServer(app);
app.use(express.urlencoded({ extended: true }));

var io = require('socket.io')(http);


var players = [];
var bullets = [];
var newPlayer = null;


app.get('/', function(req, res){
	res.sendFile(__dirname + '/start.html');
});


app.get('/start', function(req, res){
	res.sendFile(__dirname + '/start.html');
});


app.post('/start', function(req, res){
	res.sendFile(__dirname + '/index.html');
	newPlayer = req.body;
});


io.on('connection', function(socket){
	console.log(newPlayer.name + " connected");
	players.push({
		id: socket.id,
		pos: {x: 0, y: 0},
		speed: 0.3,
		name: newPlayer.name,
		color: newPlayer.color,
		score: 0,
		bullets: 3
	});
	socket.emit("player-connected", players[players.length - 1]);
	io.emit("game-log", newPlayer.name + " connected");

	socket.on("update", (data) => {

		players = players.map(player => {
			if (player.id == data.id) { 
				player.pos = data.pos;
				player.speed = data.speed;
				player.bullets = data.bullets; 
			}
			return player;
		});

		bullets = bullets.map((bul) => {
			bul.pos.x += bul.speed * bul.cos;
			bul.pos.y += bul.speed * bul.sin;
			return bul;
		});

		var scoresFor = [];

		bullets = bullets.filter((bul) => {
			if (bul.pos.x + 15 > 600 || bul.pos.x < 0) return false;
			if (bul.pos.y + 15 > 500 || bul.pos.y < 0) return false;

			var isCollide = false;
			players.forEach((player) => {
				if ((player.pos.x < bul.pos.x + 15) && (player.pos.x + 40 > bul.pos.x)
				&& 	(player.pos.y < bul.pos.y + 15) && (player.pos.y + 40 > bul.pos.y)
				&&  (player.id != bul.id))
				{
					isCollide = true;
					return;
				}
			});
			if (isCollide) {
				scoresFor.push(bul.id);
				return false;
			}

			return true;
		});

		players = players.map((p) => {
			if (scoresFor.indexOf(p.id) != -1) {
				// console.log(p.score);
				p.score++;
				p.bullets++;
				io.emit("game-log", p.name + " score is " + p.score);
			}
			return p;
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