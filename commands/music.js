//Load node ytdl-core(you-tube-down-loader) Npmjs :https://www.npmjs.com/package/ytdl-core
const ytdl = require('ytdl-core-discord');
//Load ytsr(you-tube-search-result). Npmjs :https://www.npmjs.com/package/ytsr
const ytsr = require('ytsr');
//using ffmpeg from https://www.ffmpeg.org/

module.exports = {
    name: 'music',
    usage: '<action> <name/url>',
    //temporary 
    description: 'like every other music bot. ytdl and ytsr based \n   -play: % <m> <play> <name of the song> \n   -search: % <m> <search> <name of the song>',
    args: false,
    guildOnly: true,
    aliases: ['m'],
    category: 'Utility',
    async execute(message, args, sqliteDB) {
        //init musicSearchState
        if (typeof musicSearchState == 'undefined') {
              this.musicSearchState = false;
         }
        //check in there is already a search running
        if (this.musicSearchState == true)return;
        //get the subcommand 
        const subcommand = args.shift().toLowerCase();
        switch (subcommand) {
            case 'play':
                //get search argument 
                const playArgument = args.join(' ');
                if (playArgument) {
                    //check channel and perms, return voicechannel for later connection
                    let voiceChannel = await this.reqCheck(message)
                    //get ytsr search results 
                    let searchResult = await this.searchyt(message, playArgument, false)
                    let url = searchResult.items[0].link;
                    let title = searchResult.items[0].title;
                    //play the song
                    await this.play(message, voiceChannel, url, title)
                }
                else {
                    message.channel.send("you need to give me a song name in order to let me play it!")
                }
                break;
            case 'stop':

            case 'search':
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
                    let Userchoice;
                    while (!Userchoice) {
                        Userchoice = await message.channel.awaitMessages(response => response.author.id === message.author.id, { max: 1 })
                            .then(collected => {
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
                        //set the music info
                        let url = searchResult.items[Userchoice - 1].link;
                        let title = searchResult.items[Userchoice - 1].title;
                        //play the song
                        await this.play(message, voiceChannel, url, title);
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
        //for testing
        console.log(searchResult);
        if (state) {
            for (let i = 0; i < limit; i++) {
                message.channel.send(`${searchResult.items[i].title}`);
            }
        }
        return searchResult;
    },
    //play the song using ytdl
    async play(message, voiceChannel, url, title) {
        try {
            var connection = await voiceChannel.join();
            if (connection) { message.channel.send(`Joined channel ${message.member.voice.channel.name}`) }
            let stream = await ytdl(url, { filter: 'audioonly', highWaterMark: 1 << 25 });
            let dispatcher = await connection.play(stream, { type: 'opus' })
            dispatcher.on("error", e => {
                console.error(e);
                message.channel.send("....");
            })
            message.channel.send(`now playing ${title}`)
            dispatcher.setVolumeLogarithmic(1);
        }
        catch (err) {
            console.log(err);
            return
        }
    },
}