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
		let filecode = req.hostname.split('.')[0]; // for home page just create file in directory named as the last level of base hostname
		let webroot = path.join(FILES_DIR, filecode);
		let webrootdirlist = fs.readdirSync(webroot);
		if (webrootdirlist.length > 1) {
			// serve like static web server
			let webpath = path.join(webroot, req.url);
			if (webpath.length < webroot.length) webpath = webroot; // TODO idk a better way to do this
			let webfilename = path.basename(req.url);
			if (fs.statSync(webpath).isDirectory()) {
				// serve index* file if it exists
				for (let webfilename of webrootdirlist) {
					if (webfilename.startsWith("index") && !fs.statSync(webpath).isDirectory())
						return sendfile(webroot, webfilename, webpath);
				}
				// else generate directory listing
				let webdirlist = fs.readdirSync(webpath);
				let html = webdirlist.map(fn => `<a href="${fn}">${fn}<a><br>`).join('\n');
				res.send(html);
			} else {
				sendfile(webroot, webfilename, webpath);
			}
		} else if (webrootdirlist.length == 1) {
			// serve the one file
			sendfile(webroot, webrootdirlist[0]);
		} else {
			// bruh
			res.sendStatus(204);
		}
		function sendfile(webroot, filename) {
			return res.sendFile(filename, {
				root: path.join(process.cwd(), webroot),
				headers: {
					"Content-Disposition": `filename=${filename}`
				}
			});
		}
	} catch(error) {
		res.status(error.code == "ENOENT" ? 404 : console.error(error.stack) || 500).send(error.message);
	}
});

app.listen(8568, "127.0.0.1");
