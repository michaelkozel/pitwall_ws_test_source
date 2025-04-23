// npm i axios signalr
const axios = require('axios');
const ws = require('ws');
const fs = require('fs')

async function negotiate() {
	const hub = encodeURIComponent(JSON.stringify([{name:"Streaming"}]));
	const url = `https://livetiming.formula1.com/signalr/negotiate?connectionData=${hub}&clientProtocol=1.5`
	const resp = await axios.get(url);
	return resp;
}

async function connectwss(token, cookie) {
	const hub = encodeURIComponent(JSON.stringify([{name:"Streaming"}]));
	const encodedToken = encodeURIComponent(token);
	const url = `wss://livetiming.formula1.com/signalr/connect?clientProtocol=1.5&transport=webSockets&connectionToken=${encodedToken}&connectionData=${hub}`
	const p = new Promise((res, rej) => {
		const sock = new ws.WebSocket(url, {headers: {
			'User-Agent': 'BestHTTP',
			'Accept-Encoding': 'gzip,identity',
			'Cookie': cookie
		}});

		sock.on('open', ev => {
			res(sock);
		});
		sock.on('message', (data) => {
			console.log('received %s', data);
			saveToFile(data);
		});
	});
	return p
}

async function main() {
	try {
		const resp = await negotiate();

		console.log(resp.data);
		console.log(resp.headers);
		const sock = await connectwss(resp.data['ConnectionToken'], resp.headers['set-cookie']);



		var topics =
		[
			"Heartbeat",
			"CarData.z",
			"Position.z",
			"CarData",
			"Position",
			"ExtrapolatedClock",
			"TopThree",
			"TimingStats",
			"TimingAppData",
			"WeatherData",
			"TrackStatus",
			"DriverList",
			"RaceControlMessages",
			"SessionInfo",
			"SessionData",
			"LapCount",
			"TimingData",
			"ChampionshipPrediction",
			"TeamRadio",
			"TyreStintSeries",
		];

		sock.send(JSON.stringify(
			{
				"H": "Streaming",
				"M": "Subscribe",
				"A": [[
					"Heartbeat",
					"CarData.z",
					"Position.z",
					"CarData",
					"Position",
					"ExtrapolatedClock",
					"TopThree",
					"TimingStats",
					"TimingAppData",
					"WeatherData",
					"TrackStatus",
					"DriverList",
					"RaceControlMessages",
					"SessionInfo",
					"SessionData",
					"LapCount",
					"TimingData",
					"ChampionshipPrediction",
					"TeamRadio",
					"TyreStintSeries",
				]],
				"I": 1
			}
		));
	} catch(e) {
		console.error(e);
	}
}


function saveToFile(data) { 
	
	fs.appendFile('data/jeddah_race.txt', data + '\n', (err) => { if (err) { console.error('Error writing to file:', err); } }); }

main();
