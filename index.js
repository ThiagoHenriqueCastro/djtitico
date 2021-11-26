import { Client, Intents, MessageEmbed } from "discord.js";
import { Player } from "discord-music-player";
import lyricsFinder from "lyrics-finder";
// import * as dotenv from "dotenv";
// dotenv.config();

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

const colors = {
  Success: "GREEN",
  Waiting: "YELLOW",
  IDLE: "BLUE",
  Error: "RED",
};

client.login(process.env.TOKEN);

const player = new Player(client, {
  leaveOnEmpty: true,
  leaveOnStop: true,
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

  let args = message.content.slice(prefix.length).trim().split(" ");
  let cmd = args.shift()?.toLowerCase();
  let channel = message.member.voice.channel;
  let guildQueue = player.getQueue(message.guild.id);
  if (!channel) {
    embedBuilder(
      client,
      message,
      colors.Error,
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
        colors.error,
        "Erro ao utilizar o comando!",
        "Digite o nome ou o link da musica!"
      );
      return;
    }
    embedBuilder(
      client,
      message,
      colors.Waiting,
      "DJ Titico está pesquisando...",
      search
    );

    let queue = player.createQueue(message.guild.id, {
      data: {
        message: message,
      },
    });
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
    embedBuilder(
      client,
      message,
      colors.Waiting,
      "DJ Titico pulou essa musica!"
    );
    guildQueue.skip(args[0] ? args[0] : null);
    return;
  }

  if (cmd === "stop") {
    embedBuilder(
      client,
      message,
      colors.error,
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

    embedBuilder(
      client,
      message,
      colors.Success,
      "Fila de musicas",
      currentQueue
    );
    return;
  }

  if (cmd === "help" || cmd === "h") {
    embedBuilder(
      client,
      message,
      colors.IDLE,
      "Lista de comandos",
      `**1. >play ou >p** -> Toca uma musica ou playlist. Digita ai o nome da musica ou link!\n**2. >queue ou >q** -> Mostra a lista de musicas na fila\n**3. >skip** -> Pula uma musica\n**4. >playing** -> Mostra a musica sendo tocada no momento\n**5. >stop** -> Encerra a sessão do DJ Titico\n`
    );
    return;
  }

  if (cmd === "playing") {
    embedBuilder(
      client,
      message,
      colors.Success,
      "DJ Titico está tocando agora",
      guildQueue.nowPlaying.name
    );
    return;
  }

  if (cmd === "lyrics" || cmd === "l") {
    try {
      let _lyrics = await lyricsFinder(
        guildQueue.nowPlaying.author,
        guildQueue.nowPlaying.name
      );
      if (_lyrics)
        embedBuilder(
          client,
          message,
          colors.Success,
          guildQueue.nowPlaying.name,
          _lyrics
        );
      else throw "No lyrics found!\n" + _lyrics;
    } catch (err) {
      embedBuilder(
        client,
        message,
        colors.Error,
        "Erro ao conseguir a letra :(",
        "Não existe letra para essa musica disponivel!"
      );
      console.log(err);
    }

    return;
  }
});

player
  .on("songFirst", (queue, song) => {
    embedBuilder(
      client,
      queue.data.message,
      colors.Success,
      "DJ Titico esta tocando!",
      `${song.name}\  -  \`${song.duration}\` \n\n ${
        song.requestedBy ? `por ${song.author}` : ``
      }`,
      song.thumbnail
    );
  })
  .on("songAdd", (queue, song) => {
    embedBuilder(
      client,
      queue.data.message,
      colors.Success,
      "DJ Titico adicionou uma musica!",
      `${song.name}\  -  \`${song.duration}\` \n\n ${
        song.requestedBy ? `por ${song.author}` : ``
      }`,
      song.thumbnail
    );
  })
  .on("songChanged", (queue, song) => {
    embedBuilder(
      client,
      queue.data.message,
      colors.Success,
      "DJ Titico agora está tocando!",
      `${song.name}\  -  \`${song.duration}\` \n\n ${
        song.requestedBy ? `por ${song.author}` : ``
      }`,
      song.thumbnail
    );
  })
  .on("error", (error, queue) => {
    embedBuilder(
      client,
      queue.data.message,
      colors.error,
      "DJ Titico ta com defeito",
      "Algum problema ocorreu! Favor contatar Titico para solução"
    );
  })
  .on("channelEmpty", (queue) => {
    console.log("Leaving!");
    queue.connection.leave();
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
