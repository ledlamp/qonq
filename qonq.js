var colors = require("colors");
var express = require("express");
var formidable = require("formidable");
var serveIndex = require("serve-index");
var path = require("path");
var fs = require("fs");

const FILES_DIR = "files";
const AUTH_TOKEN = fs.readFileSync("auth.txt", "utf8").trim();
var app = express();
app.enable('trust proxy', '127.0.0.1');

app.use((req, res, next)=>{
	var d = new Date;
	res.on("finish", () => {
		var sc = res.statusCode.toString(), sc = sc.startsWith('2') ? sc.green : sc.startsWith('3') ? sc.cyan : sc.startsWith('4') ? sc.red : sc.startsWith('5') ? sc.yellow.bgRed : sc;
		console.log(`${`[${d.toISOString()}]`.magenta} ${req.ip.cyan} ${req.method.bold.yellow} ${req.hostname}${req.url} ${sc} ${`"${req.headers["user-agent"]}"`.gray} ${Date.now()-d}ms`);
	});
	next();
});

app.post("/upload", (req, res, next) => {
	if (req.headers.authentication != AUTH_TOKEN) return res.status(403).send("Unauthorized");
	var form = new formidable.IncomingForm({
		maxFileSize: 2**30, // 1 GiB
		maxFields: 1,
		uploadDir: "files/tmp"
	});
	form.parse(req, function(err, fields, files) {
		if (err) return next(err);
		var file = files.file;
		if (!file) return res.sendStatus(400);
		do {
			var filecode = Math.random().toString(36).slice(2).substring(0,4);
		} while ( fs.existsSync(path.join(FILES_DIR, filecode)) && !console.log("oof") );
		try {
			fs.mkdirSync(path.join(FILES_DIR, filecode));
			fs.renameSync(file.path, path.join(FILES_DIR, filecode, file.name));
		} catch(e) {
			return next(e);
		}
		let url = `${req.protocol}://${filecode}.${process.env.PREFERRED_HOST||req.headers.host}`;
		res.send(url);
		require("./discord-preloader.js")(url);
	});
});

app.get("*", function(req, res, next){
	let filecode = req.hostname.split('.')[0]; // for home page just create file in directory named as the last level of base hostname
	let webroot = path.join(FILES_DIR, filecode);
	let webrootdirlist = fs.readdirSync(webroot);
	if (webrootdirlist.length > 1) {
		req.url = path.join(filecode, req.url);
		next();
	} else if (webrootdirlist.length == 1) {
		res.sendFile(webrootdirlist[0], {
			root: path.join(process.cwd(), webroot),
			headers: {"Content-Disposition": `filename=${webrootdirlist[0]}`}
		});
	} else {
		res.sendStatus(204);
	}
});

app.get("*", express.static(FILES_DIR), serveIndex(FILES_DIR, {icons: true}));

app.use(function (error, req, res, next) {
	res.status(error.code == "ENOENT" ? 404 : console.error(error.stack) || 500).send(error.toString());
});

app.listen(process.env.PORT || 8568, process.env.ADDRESS);
