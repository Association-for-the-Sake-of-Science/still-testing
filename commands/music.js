//Load node ytdl-core(you-tube-down-loader) Npmjs :https://www.npmjs.com/package/ytdl-core
const ytdl = require('ytdl-core-discord');
//Load ytsr(you-tube-search-result). Npmjs :https://www.npmjs.com/package/ytsr
const ytsr = require('ytsr');
//using ffmpeg from https://www.ffmpeg.org/

module.exports = {
    name: 'music',
    usage: '   -play: %<music>(m) <play>(p) <name of the song>\n    -search: %<music>(m) <search>(s) <name of the song>', 
    description: 'like every other music bot. ytdl and ytsr based',
    args: false,
    guildOnly: true,
    aliases: ['m'],
    category: 'Utility',
    async execute(message, args, sqliteDB) {
        //init musicSearchState
        if (typeof this.musicSearchState == 'undefined') {
            this.musicSearchState = false;
        }
        //init song queue 
        if (typeof this.songQueue == 'undefined') {
            this.songQueue = [];
        }
        //check in there is already a search running
        if (this.musicSearchState == true) return;
        //get the subcommand 
        const subcommand = args.shift().toLowerCase();
        switch (subcommand) {
            case 'play': case 'p':
                //get song name 
                const playArgument = args.join(' ');
                if (playArgument) {
                    //check channel and perms, return voicechannel for later connection
                    let voiceChannel = await this.reqCheck(message)
                    //get ytsr search results 
                    let searchResult = await this.searchyt(message, playArgument, false)
                    //get the info of the song
                    var songInfo = { url: searchResult.items[0].link, title: searchResult.items[0].title };
                    this.songQueue.push(songInfo)
                    //if there is no music in the queue, play the song. Else queue the song
                    console.log(this.songQueue);
                    if (this.songQueue[1] == undefined) {
                        var connection = await voiceChannel.join();
                        if (connection) {
                            message.channel.send(`Joined channel \`${message.member.voice.channel.name}\``)
                        } else {
                            message.channel.send('error joining channel');
                            return;
                        }
                        await this.play(message, voiceChannel, connection)
                    }
                    else {
                        message.channel.send(`queued ${songInfo.title}`)
                    }
                }
                else {
                    message.channel.send("you need to give me a song name in order to let me play it!")
                }
                break;
            case 'stop':
                //not working for now 
                if (!message.member.voice.channel)
                    return message.channel.send(
                        "You have to be in a voice channel to stop the music!"
                    );
                break;
            case 'search': case 's':
                //get search argument 
                const searchArgument = args.join(' ');
                if (searchArgument) {
                    //check channel and perms, return voicechannel for later connection
                    let voiceChannel = await this.reqCheck(message)
                    //get ytsr search results 
                    let searchResult = await this.searchyt(message, searchArgument, true)

                    //set the search state to true to prevent command overlapping
                    this.musicSearchState = true;
                    //wait for the user to chose the version to play 
                    const searchLimit = (await this.getsearchoptions()).limit;
                    //create userchoice and wait for user to choose a version of the song 
                    let Userchoice;
                    while (!Userchoice) {
                        Userchoice = await message.channel.awaitMessages(response => response.author.id === message.author.id, { max: 1 })
                            .then(collected => {
                                //check if user want to cancel search 
                                if (collected.first().content == "cancel") {
                                    message.channel.send('\:white_check_mark: successfuly canceled');
                                    return "cancel";
                                }
                                //check if user's responce is valid 
                                const number = parseInt(collected.first().content);
                                if (number < searchLimit) {
                                    return parseInt(collected.first().content);
                                } else {
                                    message.channel.send(`please enter a valid number under or equal to ${searchLimit}`)
                                    return;
                                }
                            })
                            .catch(err => {
                                console.log(err)
                            });
                    }
                    //set the search state to false to reenable music command 
                    this.musicSearchState = false;
                    //check if user canceled the search 
                    if (Userchoice == "cancel") break;
                    //set the song info
                    var songInfo = { url: searchResult.items[Userchoice - 1].link, title: searchResult.items[Userchoice - 1].title };
                    this.songQueue.push(songInfo)
                    //if there is no music in the queue, play the song. Else queue the song
                    console.log(this.songQueue);
                    if (this.songQueue[1] == undefined) {
                        var connection = await voiceChannel.join();
                        if (connection) {
                            message.channel.send(`Joined channel \`${message.member.voice.channel.name}\``)
                        } else {
                            message.channel.send('error joining channel');
                            return;
                        }
                        await this.play(message, voiceChannel, connection)
                    }
                    else {
                        message.channel.send(`queued ${songInfo.title}`)
                    }
                }
                else {
                    message.channel.send("you need to give me a song name in order to let me play it!")
                }
                break;
            default:
        }
    },
    async reqCheck(message) {
        const voiceChannel = message.member.voice.channel;
        //check if user is in a voice channel
        if (!voiceChannel) {
            message.channel.send("You need to be in a voice channel to play music!");
            return;
        }
        //check if the bot have the perms to join and play 
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            message.channel.send("I need the permissions \`'connect'\` and \`'speak'\` to join and play music in your voice channel!");
            return;
        }
        return voiceChannel;
    },
    //set the play option. will be changed in future updates to db
    async getsearchoptions() {
        const searchoptions = {
            limit: 5,
            volume: 5,
        }
        return searchoptions;
    },
    //search given song name or whatever in youtube using ytsr 
    async searchyt(message, playArgument, state) {
        var options = await this.getsearchoptions();
        const limit = options.limit;
        const searchResult = await ytsr(playArgument, options).catch(err => { console.log(err); })
        console.log(searchResult);
        const data = [];
        data.push(`**Search results:**\n`);
        //for testing
        if (state) {
            for (let i = 0; i < limit; i++) {
                const num = i + 1;
                data.push(`${num}.  -  ${searchResult.items[i].title}`);
            }
        }
        data.push('\nType a number to chose a song, Type \`cancel\` to exit')
        message.channel.send(data)
        return searchResult;
    },
    //play the song using ytdl
    async play(message, voiceChannel, connection) {
        //leave if there is no more song in the queue 
        if (this.songQueue[0] == undefined) {
            voiceChannel.leave();
            return;
        }
        try {
            //get the first song in the queue and play it
            songPlay = this.songQueue[0];
            let stream = await ytdl(songPlay.url, { filter: 'audioonly', highWaterMark: 1 << 25 });
            let dispatcher = await connection.play(stream, { type: 'opus' })
            dispatcher
                .on("finish", () => {
                    //play the next song when the song finished playing 
                    this.songQueue.shift();
                    this.play(message, voiceChannel, connection);
                })
                .on("error", e => {
                    console.error(e);
                    message.channel.send("....");
                })
            message.channel.send(`now playing \:notes: \`${songPlay.title}\``)
            dispatcher.setVolumeLogarithmic(1);
        }
        catch (err) {
            console.log(err);
            return
        }
    },
}