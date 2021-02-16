const { Client, IntegrationApplication } = require('discord.js');
const { registerCommands, registerEvents } = require('./utils/registry');
const config = require('../slappey.json');
const client = new Client();
var mappingUserToMessage = new Map();
var timeoutTime = 60000;

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
      if (category != null) {
        const channel = findChannelToPost(category);

        if (oldChannel == null) {
          //user joins voice channel
          //if this is a new guild from the saved message, delete saved message
          if (mappingUserToMessage.has(newMember.member.id)) {
            if (mappingUserToMessage.get(newMember.member.id).guild !== newChannel.guild) {
              mappingUserToMessage.delete(newMember.member.id);
            }
          }
          //send join
          if (mappingUserToMessage.has(newMember.member.id)) {
            mappingUserToMessage.get(newMember.member.id).edit(newMember.member.displayName + " has joined " + newChannel.name + ".");
          }
          else {
            sendJoinMessage(newMember.member, channel, newChannel, timeoutTime);
          }

        }
        else {
          //user moves voice channel
          //if moving to different category in same server
          if (oldChannel.parent !== newChannel.parent) {
            //send moving messages to both channels, and set new channel message as the user's message
            //send to old category
            const oldCategory = oldChannel.parent;
            if (oldCategory != null) {
              const channel2 = findChannelToPost(oldCategory);
              if (mappingUserToMessage.has(newMember.member.id)) {
                mappingUserToMessage.get(newMember.member.id).edit(newMember.member.displayName + " has left " + oldChannel.name + ".");
              }
              else {
                sendHasLeftMessage(newMember.member, channel2, oldChannel, timeoutTime);
              }
            }
            //erase user's message in map
            if (mappingUserToMessage.has(newMember.member.id)) {
              mappingUserToMessage.delete(newMember.member.id);
            }
            //send to new category
            sendMoveMessage(newMember.member, channel, newChannel, timeoutTime);
            
            
          }
          else {
            //regular moving in between different channels in same category
            if (mappingUserToMessage.has(newMember.member.id)) {
              mappingUserToMessage.get(newMember.member.id).edit(newMember.member.displayName + " has moved to " + newChannel.name + ".");
            }
            else {
              sendMoveMessage(newMember.member, channel, newChannel, timeoutTime);
            }
          }

         
        }
      }

    }
  }
  else {
    //user leaves voice channel
    const category = oldChannel.parent;
    if (category != null) {
      const channel = findChannelToPost(category);
      if (mappingUserToMessage.has(newMember.member.id)) {
        mappingUserToMessage.get(newMember.member.id).edit(newMember.member.displayName + " has left " + oldChannel.name + ".");
      }
      else {
        sendHasLeftMessage(newMember.member, channel, oldChannel, timeoutTime);
      }

    }
    
  }
});

function deleteMessage(msg, memberID) {
  // console.log("CALLED");
  mappingUserToMessage.delete(memberID);
  msg.delete();
  
}

function sendJoinMessage(member, channel, newChannel, timeout) {
  channel.send(member.displayName + " has joined " + newChannel.name + ".")
    .then(msg => {
      mappingUserToMessage.set(member.id, msg)
      setTimeout(function() {
        deleteMessage(msg, member.id)
      }, timeout)
    })
    .catch();
}

function sendMoveMessage(member, channel, newChannel, timeout) {
  channel.send(member.displayName + " has moved to " + newChannel.name + ".")
    .then(msg => {
      mappingUserToMessage.set(member.id, msg)
      setTimeout(function() {
        deleteMessage(msg, member.id)
      }, timeout)
      
    })
    .catch();
}

function sendHasLeftMessage(member, channel, oldChannel, timeout) {
  // console.log(channel.name);
  channel.send(member.displayName + " has left " + oldChannel.name + ".")
    .then(msg => {
      mappingUserToMessage.set(member.id, msg)
      setTimeout(function() {
        deleteMessage(msg, member.id)
      }, timeout)
      
    })
    .catch();
}

function findChannelToPost(category) {
  const categoryChannels = category.children.filter(channel => channel.type == "text");
  categoryChannels.sort(function(a, b) {
    return a.rawPosition - b.rawPosition;
  });
  // categoryChannels.forEach(channel => {
  //   if (channel.name.includes('chat') || channel.name.includes('voice')) {
  //     console.log(channel.name);
  //     return channel;
  //   }
  // });
  for (const pair of categoryChannels) {
    const channel = pair[1];
    if (channel.name.includes('chat') || channel.name.includes('voice')) {
      return channel;
    }
  }
  return categoryChannels.entries().next().value[1];
}
