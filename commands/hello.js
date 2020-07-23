let i = 0;
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
		console.log(`hello from ${message.mentions.users.first()}!`);
		console.log(args);
		console.log(`hello from ${message.mentions.users.first().id}!`);
	}
};