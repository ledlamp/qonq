module.exports = {
	"apps": [
		{
			"name": "file server v1",
			"script": "fsv1.js",
			"uid": "www-data"
		},
		{
			"name": "file server v2",
			"script": "fsv2.js",
			"uid": "www-data",
			"log_file": "fsv2.log"
		}
	]
}

