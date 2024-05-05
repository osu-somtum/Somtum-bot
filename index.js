const fs = require('node:fs');
const path = require('node:path');
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Client,
    Events,
    GatewayIntentBits,
    InteractionType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Collection,
    Message,
  } = require('discord.js');
  var mysql = require('mysql');
const { token, sql_host, sql_user, sql_password, sql_database, } = require('./config.json');
const { channel } = require('node:diagnostics_channel');
var nodemailer = require('nodemailer');

var con = mysql.createConnection({
  host: sql_host,
  user: sql_user,
  password: sql_password,
  database: sql_database
});

// function to connect mysql
function connectsql() {
  return new Promise((resolve, reject) => {
      con = mysql.createConnection({
          host: sql_host,
          user: sql_user,
          password: sql_password,
          database: sql_database
      });
      con.connect((err) => {
          if (err) {
              reject(err);
          } else {
              resolve();
          }
      });
  });
};

function asynqQuery(query, params) {
  return new Promise((resolve, reject) => {
      con.query(query, params, (err, result) => {
          if (err) {
              reject(err);
          } else {
              resolve(result);
          }
      });
  });
}

// function for disconnect from mysql
function disconnectsql() {
  return new Promise((resolve, reject) => {
      con.end((err) => {
          if (err) {
              reject(err);
          } else {
              console.log("Disconnected from database")
              resolve();
          }
      });
  });
};

// Create a new client instance
const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
    ],
  });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}
  
  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
      if (interaction.customId === 'verification-button') {
        console.log("Getting username")
        const verifyjs = require('./commands/utility/verify.js');
        if (interaction.user.id !== verifyjs.userid) {
            interaction.reply('You are not the one who requested this verification!!!!');
            return;
        }
        console.log(verifyjs.username)
        const modal = new ModalBuilder()
          .setCustomId('verification-modal')
          .setTitle('Verify somtum account with email')
          .addComponents([
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('verification-input')
                .setLabel(`Verification code for ${verifyjs.username}`)
                .setStyle(TextInputStyle.Short)
                .setMinLength(6)
                .setMaxLength(6)
                .setPlaceholder('727727')
                .setRequired(true),
            ),
          ]);
  
        await interaction.showModal(modal);
      }
    }
  
    if (interaction.type === InteractionType.ModalSubmit) {
      if (interaction.customId === 'verification-modal') {
        const verifyjs = require('./commands/utility/verify.js');
        const response =
          interaction.fields.getTextInputValue('verification-input');
        if (response != verifyjs.sixdigit) {
            console.log(response)
            verifyjs.message.edit('Invalid verification code, please try again ;-;');
            return;
            }
        else {
          // insert discord_id to database
          await connectsql();
          await asynqQuery(`UPDATE users SET discord_id = '${verifyjs.userid}' WHERE name = '${verifyjs.username}'`);
            verifyjs.message.edit(`Now ${verifyjs.username} has been linked to your discord account! (<@${verifyjs.userid}>) <3`);
            await disconnectsql();
        }
        let thismsg = await interaction.reply(`Verifying...`, { ephemeral: true });
        thismsg.delete();
      }
    }
  });
  
// set status like someone development this stupid bot right now
client.once(Events.ClientReady, readyClient => {
    readyClient.user.setActivity('someone development this stupid bot right now', { type: 'WATCHING' });
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});


client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!, Please try again!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!, Please try again!', ephemeral: true });
		}
	 }
});

// mysql
//con.connect(function(err) {
//    if (err) throw err;
//    console.log("Connected!");
//  });

process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Node NOT Exiting...");
  });

//module.exports.con = con;
client.login(token);
