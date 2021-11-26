import { Client, Intents, MessageEmbed } from "discord.js";
import { Player } from "discord-music-player";
//import * as dotenv from "dotenv";
//dotenv.config();

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

client.login(process.env.TOKEN);

let textChannel;

const player = new Player(client, {
  leaveOnEmpty: false,
});

const prefix = ">";

// LISTENERS

client.on("ready", () => {
  console.log("The bot is ready!");
});
client.on("reconnecting", () => {
  console.log("The bot is reconnecting!");
});
client.on("disconnect", () => {
  console.log("The bot is disconnected!");
});

client.on("messageCreate", async (message) => {
  if (
    !message.guild ||
    message.author.bot ||
    !message.content.startsWith(prefix)
  )
    return;

  textChannel = message;
  let args = message.content.slice(prefix.length).trim().split(" ");
  let cmd = args.shift()?.toLowerCase();
  let channel = message.member.voice.channel;
  let guildQueue = player.getQueue(message.guild.id);
  if (!channel) {
    embedBuilder(
      client,
      message,
      "RED",
      "Erro ao utilizar o comando!",
      "Você precisa estar em um canal para tocar uma musica."
    );
    return;
  }
  if (cmd === "p" || cmd === "play") {
    let search = args.join(" ");

    if (!search) {
      embedBuilder(
        client,
        message,
        "RED",
        "Erro ao utilizar o comando!",
        "Digite o nome ou o link da musica!"
      );
      return;
    }
    embedBuilder(
      client,
      message,
      "YELLOW",
      "DJ Titico está pesquisando...",
      search
    );

    let queue = player.createQueue(message.guild.id);
    await queue.join(channel);

    let song = (await search.includes("playlist"))
      ? queue.playlist(search).catch((err) => {
          if (!guildQueue) queue.stop();
        })
      : queue.play(search).catch((err) => {
          if (!guildQueue) queue.stop();
        });

    return;
  }

  if (cmd === "skip") {
    embedBuilder(client, message, "YELLOW", "DJ Titico pulou essa musica!");
    guildQueue.skip();
    return;
  }

  if (cmd === "stop") {
    embedBuilder(
      client,
      message,
      "RED",
      "Mandaram o DJ Titico parar!",
      "Vishkk \nFui expulso"
    );
    guildQueue.stop();
    return;
  }

  if (cmd === "queue" || cmd === "q") {
    let currentQueue;
    if (guildQueue) {
      currentQueue = guildQueue.songs
        .map((song, id) => `**${id + 1}**. ${song.name} - \`${song.duration}\``)
        .join("\n");
    }

    embedBuilder(client, message, "GREEN", "Fila de musicas", currentQueue);
    return;
  }

  if (cmd === "playing") {
    embedBuilder(
      client,
      message,
      "GREEN",
      "DJ Titico está tocando agora",
      guildQueue.nowPlaying.name
    );
    return;
  }
});

player
  .on("songFirst", (queue, song) => {
    embedBuilder(
      client,
      textChannel,
      "GREEN",
      "DJ Titico esta tocando!",
      `${song.name}\  -  \`${song.duration}\` \n\npor ${song.author}`,
      song.thumbnail
    );
  })
  .on("songAdd", (queue, song) => {
    embedBuilder(
      client,
      textChannel,
      "GREEN",
      "DJ Titico adicionou uma musica!",
      `${song.name}\  -  \`${song.duration}\` \n\npor ${song.author}`,
      song.thumbnail
    );
  })
  .on("songChanged", (queue, song) => {
    embedBuilder(
      client,
      textChannel,
      "GREEN",
      "DJ Titico agora está tocando!",
      `${song.name}\  -  \`${song.duration}\` \n\npor ${song.author}`,
      song.thumbnail
    );
  })
  .on("error", (error, queue) => {
    embedBuilder(
      client,
      textChannel,
      "RED",
      "DJ Titico ta com defeito",
      "Algum problema ocorreu! Favor contatar Titico para solução"
    );
  });

export function embedBuilder(
  client,
  message,
  color,
  title = null,
  description = null,
  thumbnail = null
) {
  const embed = new MessageEmbed()
    .setColor(color)
    .setFooter(client.user.username, client.user.displayAvatarURL());
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (thumbnail) embed.setThumbnail(thumbnail);

  return message.channel.send({ embeds: [embed] });
}
