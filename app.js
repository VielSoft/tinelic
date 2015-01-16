require('newrelic')
var tinyback = require('tinyback');
var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');

var cfg = {
	modules:[
		{name:"prefixify",object:tinyback.prefixify()},
		{name:"mongo",object:tinyback.mongodb()},
		{name:"restapi",object:tinyback.restapi()},
		{name:"assets",require:"./modules/assetsapi.js"},
		{name:"collect",require:"./modules/collectapi.js"},
		{name:"web",require:"./modules/web"}
	],
	config:{
		mongo:{
			main:{
				db:"tinelic",
				host:"localhost",
//				host:"errbit.pushok.com",
				port:27017,
				scfg:{auto_reconnect: true, poolSize : 40},
				ccfg:{native_parser: false, safe: true, w:1}
			}
		}
	}
}

tinyback.createApp(cfg, function (err, app) {
	if (err) {
		console.log(err.stack);
		process.exit(0);
	}
	try {
		var options = {
			key: fs.readFileSync(path.resolve(__dirname + '/privatekey.pem'), 'utf8'),
			cert: fs.readFileSync(path.resolve(__dirname + '/certificate.pem'), 'utf8'),
			ssl: true,
			plain: false
		}

		var httpsServer = https.createServer(options, app.express);

		httpsServer.listen(443)
	} catch (e) {};

	var httpServer = http.createServer(app.express);

	httpServer.listen(80);
})
