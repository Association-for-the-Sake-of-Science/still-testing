//create an Array to store the Usernames 
const shutuplist = [];
//create an activestate 
let activestate = false;

module.exports = {
	name: 'shutup',
	usage: ' <now/withdraw>  <@username>',
	description: 'yeetus deletus messagues',
	aliases: ['shu'],
	args: false,
	guildOnly: true,
	category: 'Utility',
	async execute(message, args) {
		//get the command and the target User 
		const subCommand = args[0];
		const ShutupUserId = message.mentions.users.first().id;
		let ifUserid = false;
		//check if the target User is the bot itself. 
		if (ShutupUserId == 732898098321293403) {
			message.reply(`oops! i can't mute myself!`)
			return
		}
		//set target user into shutup mode (put userid into shutuplist array) 
		if (subCommand === 'now') {
			for (i = 0; shutuplist[i] != undefined; i++) {
				//check if the id already exists
				if (shutuplist[i] == ShutupUserId) {
					message.reply(`@${ShutupUserId} is already in shutup mode`)
					ifUserid = true;
				}
			}
			//push the id into array 
			if (ifUserid == false) {
				shutuplist.push(ShutupUserId)
				activestate = true;
				message.reply(`succesfully set <@${ShutupUserId}> into shutup mode`)
			}
			console.log(`Current User in shutup mode:${shutuplist}`)
		}
		//remove the user from shutuplist array 
		else if (subCommand === 'withdraw' || subCommand === 'wd') {
			let ifUserid = false;
			for (i = 0; shutuplist[i] != undefined; i++) {
				if (shutuplist[i] == ShutupUserId) {
					shutuplist.splice(i, 1);
					ifUserid = true;
					if (shutuplist[0] == undefined) {
						activestate = false;
					}
					message.reply(`successfuly retracted the shutup on <@${ShutupUserId}>`)
				}
			}
			if (activestate) { message.reply(`@${ShutupUserId} is not in shutup mode`) }
			console.log(shutuplist)
		}
		//list all User in shutup mode 
		else if (subCommand === 'info') {
			if (shutuplist[0] == undefined) {
				message.reply('no one is currently on shutup mode.')
			}
			else {
				const data = [];
				data.push(`there is currently ${shutuplist.length} User in shutup mode:\n`)
				for (i = 0; shutuplist[i] != undefined; i++) {
					data.push(`<@${shutuplist[i]}>\n`)
				}
				message.channel.send(data);
			}
		}
	},
	//check the message for shutup
	check(message) {
		//just for testing 
		console.log(`shutup command state: ${activestate}`)
		if (activestate != false) {
			(
				async () => {
					//loop throgh the array to find the matching id 
					const UserId = message.author.id;
					console.log(shutuplist)
					for (i = 0; shutuplist[i] != undefined; i++) {
						if (shutuplist[i] == UserId) {
							return UserId;
						}
					}
				})()
				.then(res => {
					//now, if there is a match, yeeetus deletus!
					if (res != null) {
						message.delete();
					}
				})
				.catch(err => {
					console.log('oops at shutup check :C');
					console.error(err);
				})
		}
	},
}