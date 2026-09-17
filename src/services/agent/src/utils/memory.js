import redisClient from '../shared/config/redis.config.js'
import { getMessages } from "./getMessages.js";
export const getMemory = async(conversationId) =>{

    // check in redis first
    let key =`conversationId:${conversationId}`
    const conversation = await redisClient.get(key);
    if(conversation){
        const parsedConversation = JSON.parse(conversation)
        return Array.isArray(parsedConversation)
            ? parsedConversation
            : parsedConversation.messages ?? parsedConversation.msgs ?? []
    }
    const messages = await getMessages(conversationId) ?? [];
    await redisClient.set(key,JSON.stringify(messages),'EX',1 * 24 * 60 * 60) // 1 day
    return messages


}

export const addMessage =async(msgContext)=>{
 // msgContext ===> conversationId, content, role
    const {conversationId, content,role} = msgContext

      let key =`conversationId:${conversationId}`

       const rawMsg = await redisClient.get(key);
       
        const parsedMessages = rawMsg ? JSON.parse(rawMsg) : [];
        const msgs = Array.isArray(parsedMessages)
            ? parsedMessages
            : parsedMessages.messages ?? parsedMessages.msgs ?? [];
        msgs.push({content,role})
        // keep 20 record
        if(msgs.length > 10){
            msgs.shift()
        }
        await redisClient.set(key,JSON.stringify(msgs),'EX',1 * 24 * 60 * 60) // 1 day
        return true


   
}