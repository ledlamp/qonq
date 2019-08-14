var basehostnames = [
    "screenshots.fookat.tk",
    "ss.fookat.tk",
    "qonq.ga"
];
var filedir = "public";

var express = require("express");
//var morgan = require("morgan");
var formidable = require("formidable");
var path = require("path");
var fs = require("fs");

var auth_token = fs.readFileSync("auth.txt", "utf8").trim();
var app = express();
app.enable('trust proxy', '127.0.0.1');

//app.use(morgan("combined"));

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
        var processed_filename = file.name.toLowerCase().replace(/[^a-zA-Z0-9.-]/g, '-');
        while (fs.existsSync(path.join(filedir, processed_filename))) processed_filename += '_';
        try {
            fs.renameSync(file.path, path.join(filedir, processed_filename));
        } catch(e) {
            return next(e);
        }
        res.send(`http://${processed_filename}.${req.basehostname}`);
    });
});
/*app.get("/upload", (req, res) => {
    res.send(
        '<form enctype="multipart/form-data" method="post">'+
        '<input type="file" name="file"><br>'+
        '<input type="text" name="authorization" placeholder="authorization"><br>'+
        '<input type="submit" value="Upload">'+
        '</form>'
      );
});*/ // cant set header in browser

app.use(function(req, res){
    var filename = req.hostname.substr(0, req.hostname.indexOf(req.basehostname) - 1);
    if (filename)
        try {
            res.sendFile(filename, {root: path.join(process.cwd(), filedir)});
        } catch(e) {
            res.status(404).send(e.message);
        }
    else {
        res.send(fs.readdirSync(filedir).map(f => `<a href="//${f}.${req.basehostname}">${f}</a><br>`).join('\n'));
    }
});

app.listen(7956);
