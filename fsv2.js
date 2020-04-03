var express = require("express");
var formidable = require("formidable");
var path = require("path");
var fs = require("fs");

const FILES_DIR = "files";
const AUTH_TOKEN = fs.readFileSync("auth.txt", "utf8").trim();
var app = express();
app.enable('trust proxy', '127.0.0.1');

app.use((req, res, next)=>{
	console.log(`[${new Date().toLocaleString()}]`, '📥', req.connection.remoteAddress, `"${req.method} ${req.url} HTTP/${req.httpVersion}"`, JSON.stringify(req.headers));
	res.on("finish", () => {
		console.log(`[${new Date().toLocaleString()}]`, '📤', res.statusCode, res.statusMessage, JSON.stringify(res.getHeaders()));
	});
	next();
});

app.post("/upload", (req, res, next) => {
	if (req.headers.authentication != AUTH_TOKEN) return res.status(403).send("Unauthorized");
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		if (err) return next(err);
		var file = files.file;
		if (!file) return res.sendStatus(400);
		do {
			var filecode = Math.random().toString(36).slice(2).substring(0,4);
		} while (fs.existsSync(path.join(FILES_DIR, filecode)));
		try {
			fs.mkdirSync(path.join(FILES_DIR, filecode));
			fs.renameSync(file.path, path.join(FILES_DIR, filecode, file.name));
		} catch(e) {
			return next(e);
		}
		res.send(`${req.protocol}://${filecode}.${req.headers.host}`);
	});
});

app.get("*", function(req, res){
	try {
		var filecode = req.hostname.split('.')[0]; // for home page just create file in directory named as the last level of base hostname
		var filecodepath = path.join(FILES_DIR, filecode);
		var filename = fs.readdirSync(filecodepath)[0];
		var filenamepath = path.join(filecodepath, filename);
		res.sendFile(filenamepath, {
			root: process.cwd(),
			headers: {
				"Content-Disposition": `filename=${filename}`
			}
		});
	} catch(error) {
		res.status(error.code == "ENOENT" ? 404 : 500).send(error.message);
	}
});

app.listen(8568, "localhost");
