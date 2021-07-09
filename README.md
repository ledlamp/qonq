# qonq

Simple file host that puts the file code in the hostname. The leftmost part of the Host (i.e. `1234` of `1234.qonq.gq`) is used to serve a corresponding folder (i.e. `files/1234/`); if the folder contains one file then it is served directly, but if it contains multiple files then it is served as a webroot with a directory index. Designed for use as a ShareX Custom Uploader, but you can drop any lowercase alphanumeric folder into the files directory to serve it instantly.

Note: Please refrain from using your own file server if you cannot commit to maintaining it indefinitely, because all links you post will depend on your server and dead servers cause link rot.

## Basic set up
1. `git clone https://github.com/ledlamp/qonq.git`
2. `npm ci`
3. `echo "press random keys on your keyboard here" > auth.txt`
4. `node qonq.js`, `pm2 start qonq.js`, or run however you like

You can set `PORT` and `ADDRESS` env variables if necessary.

## ShareX config
```
{
  "Version": "12.4.1",
  "DestinationType": "ImageUploader, TextUploader, FileUploader",
  "RequestMethod": "POST",
  "RequestURL": "http://localhost:8568/upload",
  "Headers": {
    "authentication": "paste contents of auth.txt here"
  },
  "Body": "MultipartFormData",
  "FileFormName": "file"
}
```
You can import this custom uploader config and modify the Request URL and authentication fields as necessary.


## Nginx config example
```
server {
        server_name qonq.gq *.qonq.gq;
        listen 443 ssl;
        ssl_certificate /etc/letsencrypt/live/qonq.gq/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/qonq.gq/privkey.pem;
        include /etc/letsencrypt/options-ssl-nginx.conf;
        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
        client_max_body_size 1G;
        location / {
                proxy_set_header Host $host;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                proxy_pass http://localhost:8568;
        }
}
server {
        server_name qonq.gq *.qonq.gq;
        listen 80;
        return 308 https://$host$request_uri;
}
```
