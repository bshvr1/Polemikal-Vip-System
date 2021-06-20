const Discord = require("discord.js")
const client = new Discord.Client()

const fs = require('fs')
const YAML = require("yawn-yaml/cjs")
const db = require('megadb')
const voiceState = new db.crearDB('VoiceState');

let config = new YAML(fs.readFileSync("./config.yaml").toString()).json

client.login(config.bot.token).then(() => console.log(`[${client.user.tag}] succesfully connected!`)).catch((error) => console.error(`An occured error while connecting to client: ` + error.message))


let status = false;

client.on("ready", () => {
      client.user.setPresence({ activity: { name: `Ses Sistemi İçin ꑕ Shinè#5005 ❤️` , type: "PLAYING"}, status: 'dnd' })
      client.staffJoined = false;
	  client.vc = null;
      client.channels.cache.get(config.server.voiceChannel).join().then(async connection => {
          client.vc = connection;
          let taglıAlım = await voiceState.get(`taglıAlım.${connection.channel.guild.id}`)
          let toplantı = await voiceState.get(`toplantı.${connection.channel.guild.id}`)
          let staffs = connection.channel.members.filter(x => x.roles.cache.has(config.server.register))
          if(staffs.size < 1) {
			  play("./" + toplantı ? config.server.toplantı : taglıAlım ? config.server.tagliAlim : config.server.hosgeldin);
		  }
          else return client.staffJoined = true;
      })
})

client.on("voiceStateUpdate", async(oldState, newState) => {

        if(newState.member.id === client.user.id) return;
        if(
          (oldState.channelID !== newState.channelID) &&
          newState.channelID === config.server.voiceChannel &&
          newState.member.roles.cache.has(config.server.register) &&
          newState.channel.members.filter(x => x.roles.cache.has(config.server.register)).size === 1
        ) {
          client.staffJoined = true;
          await client.vc.dispatcher.end();
          return play("./" + config.server.yetkiliGiris);
          
        }

        if(
          (oldState.channelID === config.server.voiceChannel) &&
          (oldState.channelID !== newState.channelID) &&
          newState.member.roles.cache.has(config.server.register) &&
          oldState.channel.members.filter(x => x.roles.cache.has(config.server.register)).size === 0
        ) {
          client.staffJoined = false;
		  status = true;
          try {
			  await client.vc.dispatcher.end();
		  } catch(err) {
			  
		  }
		  status = false;
          let taglıAlım = await voiceState.get(`taglıAlım.${newState.guild.id}`)
          let toplantı = await voiceState.get(`toplantı.${newState.guild.id}`)
          return play("./" + toplantı ? config.server.toplantı : taglıAlım ? config.server.tagliAlim : config.server.hosgeldin)
        }
})

async function play(file) {
	if(status === true) return;
    client.vc.play(file)
    .on("finish", async() => {
        if(client.staffJoined === true) return;
        let taglıAlım = await voiceState.get(`taglıAlım.${client.vc.channel.guild.id}`)
        let toplantı = await voiceState.get(`toplantı.${client.vc.channel.guild.id}`)
        return play("./" + toplantı ? config.server.toplantı : taglıAlım ? config.server.tagliAlim : config.server.hosgeldin)
    })

}

client.on("message", msg => {
    let prefix = config.bot.prefix
    if (!prefix || prefix && !prefix.length) return console.error(`Prefix girmelisin!`)

    if (msg.content.startsWith(prefix)) {
        if (!config.bot.owners.some(r => r == msg.author.id) && msg.author.id !== msg.guild.ownerID) return;
        if (msg.content.toLowerCase() === prefix + "toplantı") {
            voiceState.set(`toplantı.${msg.guild.id}`, true)
            msg.channel.send(new Discord.MessageEmbed().setColor("RANDOM").setTitle("Toplantı Modu").setDescription("Toplantı Modu Açıldı!"))
        } else if (msg.content.toLowerCase() === prefix + "taglıalım") {
            voiceState.set(`taglıAlım.${msg.guild.id}`, true)
            msg.channel.send(new Discord.MessageEmbed().setColor("RANDOM").setTitle("Taglı Alım Modu").setDescription("Taglı Alım Modu Açıldı!"))
        } else if(msg.content.toLowerCase() === prefix+"taglıalım kapat") {
          voiceState.delete(`taglıAlım.${msg.guild.id}`)
          msg.channel.send(new Discord.MessageEmbed().setTitle("Taglı Alım Modu").setDescription("Taglı Alım Modu Kapatıldı!"))
        } else if(msg.content.toLowerCase() === prefix+"toplantı kapat") {
           voiceState.delete(`toplantı.${msg.guild.id}`)
           msg.channel.send(new Discord.MessageEmbed().setColor("RANDOM").setTitle("Toplantı Modu").setDescription("Toplantı Modu Kapatıldı!"))
        }
    }
})