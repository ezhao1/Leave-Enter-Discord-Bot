
const { Client } = require('discord.js');
const { registerCommands, registerEvents } = require('./utils/registry');
const config = require('../slappey.json');
const client = new Client();
var mappingUserToMessage = new Map();

(async () => {
  client.commands = new Map();
  client.events = new Map();
  client.prefix = config.prefix;
  await registerCommands(client, '../commands');
  await registerEvents(client, '../events');
  await client.login(config.token);
})();

client.on("voiceStateUpdate", (oldMember, newMember) => {
  const oldChannel = oldMember.channel;
  const newChannel = newMember.channel;

  if (newChannel !== null) {
    if (oldChannel != newChannel) {
      const category = newChannel.parent;
      const categoryChannels = category.children.filter(channel => channel.type == "text");

      if (oldChannel == null) {
        //user joins voice channel
        var found = false;
        categoryChannels.forEach(channel => {

            if (!found) {
              if (mappingUserToMessage.has(newMember.member.id)) {
                mappingUserToMessage.get(newMember.member.id).edit(newMember.member.displayName + " has joined " + newChannel.name + ".");
              }
              else {
                channel.send(newMember.member.displayName + " has joined " + newChannel.name + ".")
                  .then(msg => {
                    mappingUserToMessage.set(newMember.member.id, msg)
                    setTimeout(function() {
                      deleteMessage(msg, newMember.member.id)
                    }, 30000)
                    // msg.delete({timeout: 30000})
                  })
                  .catch();
                
              }
              found = true;
              
            }
        });

      }
      else {
        //user moves voice channel
        var found = false;
        categoryChannels.forEach(channel => {
          if (channel.name.includes('chat') || channel.name.includes('voice')) {
            if (!found) {
              if (mappingUserToMessage.has(newMember.member.id)) {
                mappingUserToMessage.get(newMember.member.id).edit(newMember.member.displayName + " has moved to " + newChannel.name + ".");
              }
              else {
                channel.send(newMember.member.displayName + " has moved to " + newChannel.name + ".")
                  .then(msg => {
                    mappingUserToMessage.set(newMember.member.id, msg)
                    setTimeout(function() {
                      deleteMessage(msg, newMember.member.id)
                    }, 30000)
                    // msg.delete({timeout: 30000})
                    
                  })
                  .catch();
                
              }
              found = true;
            }
          }
        });
      }

    }
  }
  else {
    //user leaves voice channel
    const category = oldChannel.parent;
    const categoryChannels = category.children.filter(channel => channel.type == "text");
    var found = false;
    categoryChannels.forEach(channel => {
      if (channel.name.includes('chat') || channel.name.includes('voice')) {
        if (!found) {
          if (mappingUserToMessage.has(newMember.member.id)) {
            mappingUserToMessage.get(newMember.member.id).edit(newMember.member.displayName + " has left " + oldChannel.name + ".");
          }
          else {
            channel.send(newMember.member.displayName + " has left " + oldChannel.name + ".")
            .then(msg => {
              mappingUserToMessage.set(newMember.member.id, msg)
              setTimeout(function() {
                deleteMessage(msg, newMember.member.id)
              }, 30000)
              // msg.delete({timeout: 30000})
              
            })
            .catch();
          }
          
          found = true;
        }
      }
    });
  }
});

function deleteMessage(msg, memberID) {
  // console.log("CALLED");
  msg.delete();
  mappingUserToMessage.delete(memberID);
}