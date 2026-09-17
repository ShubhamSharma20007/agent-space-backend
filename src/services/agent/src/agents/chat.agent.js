import { getAgentModel } from "../utils/llmModels.js"
import { AIMessage, HumanMessage,SystemMessage } from "@langchain/core/messages"
import { agentPrompts } from "../prompts/agents.prompt.js"
import { getMemory } from "../utils/memory.js"
import axios from "axios"
import deductCredits from "../utils/deductCredit.js"
import { checkAgentLimit } from "../utils/agentLimit.js"
export const chatAgent = async (state)=>{
   try {
     console.log("......CALLING CHAT AGENT......")
   await checkAgentLimit(state.userId, 'chat')
    const llm =  getAgentModel('chat')
    const history = await getMemory(state.conversationId); // previous conversation


    const searchContext =state.searchResults ?
    `
    Web search results:

    ${JSON.stringify(state.searchResults)}

    Answer the user using only the above search results.

    `
    :
    ``


   const systemPrompt = agentPrompts.chatAgentSystemPrompt
.replace('<searchContext>', searchContext?.trim()?.length > 0 ? `
    ${searchContext}
    If searchContext exists:
    - Use search results to answer.
    - Cite sources by title, not raw JSON structure.
    - Do not mention internal tools.
    - Do not include image markdown or URLs — images are handled separately.
` : '')

    const messages =[
        new SystemMessage(systemPrompt)
    ];
    history.forEach(msg=>{
        if(msg.role === 'human' || msg.role === 'user'){
            messages.push(new HumanMessage(msg.content))
        }else if(msg.role === 'assistant' || msg.role === 'ai'){
            messages.push(new AIMessage(msg.content))
        }
    })

    //  append new msg
    messages.push(new HumanMessage(state.prompt))
    const response = await llm.invoke(messages)
    console.log('chat agent response',response)

    // deduct credits 
      await deductCredits(state.userId, 'chat')
    return {
        ...state,
        agent: 'chat',
        aiResponse: response.content
    }
   } catch (error) {
     if (error.code === 429 && error.data?.message) {
        return {
            ...state,
            agent: 'chat',
            aiResponse: error.data.message
        }
    }
      return {
        ...state,
        agent: 'chat',
        aiResponse: 'Error occurred while processing your request. Please try again later.'
    }
   }

}