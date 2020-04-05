module.exports = {
	"apps": [
		{
			"script": "qonq.js",
			"uid": "file-server",
			"log_file": "qonq.log",
			"env": {
				"NODE_ENV": "production",
				"ADDRESS": "127.0.0.1"
			}
		}
	]
}

