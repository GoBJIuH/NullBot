const fs = require('fs');
const config = require('../config.json');
const {RichEmbed} = require('discord.js');

const PATH = __dirname + '/commands/';

const commands = [];
const categories = [];

module.exports = {
  init,
  commands,
  categories,
  checkPermissions,
  findCommand,
}

function init(Client) {
  let filenames = fs.readdirSync(PATH);
  for(let filename of filenames) {
    load(require(PATH + filename), Client);
  }
  categories.sort((catA, catB) => {
    return catB.commands.length - catA.commands.length;
  });

  let helpEmbed = new RichEmbed()
    .setTitle('Помощь');
  for(const cat of categories) {
    let fieldtitle = cat.name;
    let field = '\u200b';
    for(const cmd of cat.commands)
      field = field +`\u2003\u2002• \`${cmd.variants[0]}\`\n`;
    helpEmbed.addField(fieldtitle, field, true);
  }
  helpEmbed.addField('\u200b',
  'Используйте `-help <command>` для получения детальной информации');
  helpEmbed.setColor('#f4b342');
  module.exports.helpEmbed = helpEmbed;
}

function load(category, Client) {

  categories.push(category);
  for(let command of category.commands) {
    command.category = category.name;
    command.regexp = buildCommandRegExp(command, Client.user.id);
    commands.push(command);
  }
}

function buildCommandRegExp(command, clientid) {
  let prefix;

  if(command.prefix === 'mention')
    prefix = `<@!?${clientid}>\\s*`;
  else
    prefix = escapeString(command.prefix);

  let variantsString = command.variants.map(escapeString).join('|');

  return new RegExp(`${prefix}(${variantsString})(?:\\s|$)(.*)`, 'i');

  function escapeString(str) {
    return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  }
}

function findCommand(query) {
  return commands.find(cmd => cmd.variants.includes(query));
}


function checkPermissions(message, command) {
  let perms = command.permissions;
  if(!perms) return true;
  let ownerPermIndex = perms.indexOf('OWNER');
  let trustedPermIndex = perms.indexOf('TRUSTED');
  let member = message.member;
  let channel = message.channel;
  if(ownerPermIndex > -1) {
    perms.splice(ownerPermIndex, 1);
    if(trustedPermIndex > -1) perms.splice(trustedPermIndex, 1);
    if(member.id === config.ownerid &&
    channel.permissionsFor(member).hasPermissions(perms)) return true;
    else return false;
  }
  if(trustedPermIndex > -1) {
    perms.splice(trustedPermIndex, 1);

    if((member.id === config.ownerid || member.id === config.trustedids) &&
    channel.permissionsFor(member).hasPermissions(perms)) return true;
    else return false;
  }
  if(channel.permissionsFor(member).hasPermissions(perms)) return true;
  else return false;
}