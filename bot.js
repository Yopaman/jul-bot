const Discord = require('discord.js')
const sharp = require("sharp")
const twemoji = require("twemoji-parser")
const client = new Discord.Client()
const config = require('./config.json')
const https = require('https');
const fs = require("fs")

client.login(config.discord_token)

client.on("message", msg => {
    if (msg.content.startsWith("!julmoji")) {
        emojis = twemoji.parse(msg.content.split(" ")[1])
        try {
            let emojiLink = emojis[0].url

            https.get(emojiLink, (response) => {
                let data = []
                response.on('data', function(chunk) {
                    data.push(chunk);
                }).on('end', function() {
                    let buffer = Buffer.concat(data);
                    
                    sharp(buffer, {density: 900})
                    .png()
                    .resize(200, 200, {fit: sharp.fit.cover})
                    .extend({
                        top: 0,
                        bottom: 40,
                        left: 20,
                        right: 20,
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    })
                    .composite([{input: './jul_hand.png'}])
                    .toBuffer((err, data, info) => {
                        msg.channel.send({files: [data]})
                    })  
                });            
            });

        } catch(err) {
            msg.channel.send("Une erreur est survenue !")
        }
    }
})