const Discord = require('discord.js')
const sharp = require("sharp")
const twemoji = require("twemoji-parser")
const client = new Discord.Client()
const config = require('./config.json')
const https = require('https');
const fs = require("fs")
const got = require("got")
const cheerio = require('cheerio')
const Markov = require('markov-strings').default
let i = 0
let data = []

client.login(config.discord_token)

client.on("message", msg => {
    if (msg.content.startsWith("!julmoji")) {
        let emoji = msg.content.split(" ")[1]
        emojis = twemoji.parse(emoji)

        try {
            let emojiLink
            if (emoji.startsWith("<:")) {
                emojiLink = msg.guild.emojis.find((element) => {
                    return emoji.search(element.id) != -1
                }).url
            } else {
                emojiLink = emojis[0].url
            }

            https.get(emojiLink, (response) => {
                let data = []
                response.on('data', function(chunk) {
                    data.push(chunk)
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
            console.log(err)
            msg.channel.send("Une erreur est survenue !")
        }
    } else if (msg.content.startsWith("!julparoles")) {
        /*i = 0,
        data = []
        processPage(msg)*/
        msg.reply("Commande desactivée pour le moment.")
    } else if (msg.content.startsWith("!channelvideo")) {
        if (msg.member.voiceChannel) {
            msg.reply("http://discordapp.com/channels/" + msg.guild.id.toString() + "/" + msg.member.voiceChannel.id.toString())
        } else {
            msg.reply("Vous devez être connecté dans un channel vocal.")
        }
    }
})

//jul id : 74283

function processPage(msg) {
    let choosen_page = Math.floor(Math.random() * 50) + 1
    got("https://api.genius.com/artists/47263/songs?per_page=1&page=" + choosen_page.toString(), {
    headers: {Authorization: "bearer " + config.access_token},
    responseType: "json"
    }).then(result => {
        let song = result.body.response.songs[0]
        getLyrics(song.url)
        .then(line => {
            data.push(line)
            if (i < 5) {
                i++
                processPage(msg)
            } else {
                createMarkov(data.flat(), msg)
            }
        })
        
    })
}

function getLyrics(url) {
    return new Promise((resolve, reject) => {
        got(url, {
            resolveBodyOnly: true
        }).then(html => {
            let $ = cheerio.load(html)
            let lyrics = $(".lyrics").text().split("\n").filter(element => {
                return /[a-zA-Z]/.test(element[0]) && element != ''
            })
            const line = lyrics[Math.floor(Math.random() * lyrics.length)]
            resolve(lyrics)
        })
    })
    
}

function createMarkov(data, msg) {
    console.log("Création d'une phrase...")
    const markov = new Markov(data, { stateSize: 1 })
    markov.buildCorpus()

    const options = {
        maxTries: 100000,
        filter: (result) => {
            return result.score >= 50
        }
    }
    const result = markov.generate(options)

    msg.reply(result.string)
}