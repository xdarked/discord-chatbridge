const mineflayer = require('mineflayer')
const { Client, Intents, WebhookClient } = require('discord.js')

const options = {
  host: '0b0t.org', //server ip
  port: 25565, //only change if needed.
  version: '1.20', //version, seems most stable on 1.20
  auth: 'microsoft',
  username: 'BOTUSERNAME' //bot username
}

const DISCORD_TOKEN = 'DISCORDBOTTOKEN' //enter your bot token
const BRIDGE_CHANNEL_ID = 'CHANNELIDFORBRIDGE' //enter channel id for the bridge
const WEBHOOK = new WebhookClient({ url: 'YOURWEBHOOKURL' }) // enter your discord webhook

function startBot() {
  const bot = mineflayer.createBot(options)


  
  const client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES
    ]
  })

let channel

client.once('ready', () => {
  console.log(`Discord logged in as ${client.user.tag}`)

  channel = client.channels.cache.get(BRIDGE_CHANNEL_ID)
  if (!channel) {
    console.error('Bridge channel not found')
    process.exit(1)
  }
})


  //discord to minecraft
  client.on('messageCreate', async message => {
    if (message.author.bot) return
    if (message.channel.id !== BRIDGE_CHANNEL_ID) return
    let text = message.content
      .replace(/\n/g, ' ') // replace newlines with a space
      .replace(/§/g, '*') //replace kick "§" character
    if (!text.trim()) return
    if (text.length > 100) text = text.slice(0, 100)
    bot.chat(`[${message.author.username}] ${text}`)
  })


  //minecraft to discord
  bot.on('message', msg => {
    const text = msg.toString().trim()
    if (!text) return
    const match = text.match(/^<([^>]+)> (.+)$/)
    if (match) {
      let username = match[1]
      let content = match[2]
        .replace(/@everyone/g, '@ everyone')
        .replace(/@here/g, '@ here')
        .replace(/<@/g, '<@ ')

      WEBHOOK.send({
        content,
        username,
        avatarURL: `https://mc-heads.net/head/${username}`,
        flags: 4096
      })
    } else {
      WEBHOOK.send({
        content: text,
        username: 'server',
        avatarURL: `https://0b0t.org/img/logo.png`,
        flags: 4096
      })
    }
  })

  //move to talk
  bot.once('spawn', () => { bot.chatAddPattern(/^A little movement is all you need! Walk a block and let the chat flow again!.*/, 'moveToTalk') })

  bot.on('moveToTalk', () => {
    channel.send('moving to talk, send another message')
    const delay = 500
    const duration = 700
    setTimeout(() => {
      bot.setControlState('forward', true)
      setTimeout(() => {
        bot.setControlState('forward', false)
        bot.setControlState('back', true)
        setTimeout(() => {
          bot.setControlState('back', false)
        }, duration)
      }, duration)
    }, delay)
  })


  //minecraft chat to console
  bot.on('message', (message) => {
    console.log(message.toAnsi())
  })

  client.login(DISCORD_TOKEN)

  bot.on("login", () => { console.log(`${bot.username} connected to server at ${new Date}`) });
  bot.once("spawn", () => { console.log(`bot spawned at ${bot.entity.position}`) });
  bot.on("end", (reason) => { setTimeout(() => { startBot() }, 6700) });
  bot.on("kicked", (reason) => { console.log(`bot kicked for: ${reason}`) });
  bot.on("error", (err) => { console.error(`Bot error: ${err}`) });
}

startBot()
