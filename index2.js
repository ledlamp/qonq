var basehostnames = [
	"qonq.ga",
	"qonq.gq"
];
var filesdir = "files";

var express = require("express");
var formidable = require("formidable");
var path = require("path");
var fs = require("fs");

var auth_token = fs.readFileSync("auth.txt", "utf8").trim();
var app = express();
app.enable('trust proxy', '127.0.0.1');

app.use(function(req, res, next){
	for (let basehostname of basehostnames) {
		if (req.hostname.endsWith(basehostname)) {
			req.basehostname = basehostname;
			break;
		}
	}
	if (!req.basehostname) return res.status(400).send("Bad hostname " + req.hostname);
	next();
});


app.post("/upload", (req, res, next) => {
	if (req.headers.authentication != auth_token) return res.status(403).send("Unauthorized");
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		if (err) return next(err);
		var file = files.file;
		if (!file) return res.sendStatus(400);
		do {
			var filecode = Math.random().toString(36).slice(2).substring(0,4);
		} while (fs.existsSync(path.join(filesdir, filecode)));
		try {
			fs.mkdirSync(path.join(filesdir, filecode));
			fs.renameSync(file.path, path.join(filesdir, filecode, file.name));
		} catch(e) {
			return next(e);
		}
		res.send(`https://${filecode}.${req.hostname}`);
	});
});

app.get("*", function(req, res){
	var hostnamearr = req.hostname.split('.')
	if (hostnamearr.length > 2) {
		var filecode = hostnamearr[0];
		try {
			var filecodepath = path.join(filesdir, filecode);
			var filepath = path.join(filecodepath, fs.readdirSync(filecodepath)[0]);
			res.sendFile(filepath, {root: process.cwd()});
		} catch(e) {
			res.status(404).send(e.message);
		}
	} else {
		//res.send(fs.readdirSync(filesdir).map(f => `<a href="//${f}.${req.basehostname}">${f}</a><br>`).join('\n'));
		res.sendFile("index2.js", {root: process.cwd()});
	}
});

app.listen(8568, "localhost");
