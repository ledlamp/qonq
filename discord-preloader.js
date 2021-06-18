// pre-load discord embeds so they're instant when I paste the url
var https = require("https");
module.exports = function (url) {
    if (!process.env.DISCORD_WEBHOOK) return;
    https.request(process.env.DISCORD_WEBHOOK, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        }
    }).end(JSON.stringify({content:url})).on("error", ()=>{});
}
