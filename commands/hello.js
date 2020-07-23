//Load discord.js Module 
const Discord = require('discord.js')

module.exports = {
	name: 'hello',
	usage: '<hello>',
	description: 'Hello!',
	aliases: ['hallo'],
	args: false,
	guildOnly: false,
	category: 'Still Testing',
	//a command that purly existes for testing. It's also a very good template for copying 
	execute(message, args) {
		message.channel.send(`hello!`);
		//some testing stuff here.
	}
};