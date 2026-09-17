import { agentPrompts } from "../prompts/agents.prompt.js"
import { checkAgentLimit } from "../utils/agentLimit.js"
import deductCredits from "../utils/deductCredit.js"
import { getAgentModel } from "../utils/llmModels.js"
import axios from "axios"

const parseCodeGenResponse = (raw) => {
  if (!raw) return { files: [] }

  let cleaned = raw.trim()

  // remove ```json ... ``` or ``` ... ``` wrappers if the model added them anyway
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim()
  }

  try {
    const parsed = JSON.parse(cleaned)
    return {
      files: Array.isArray(parsed.files) ? parsed.files : [],
    }
  } catch (err) {
    console.error('Failed to parse code generation response:', err, raw)
    return { files: [] }
  }
}

export const codingAgent = async(agentState)=>{
try {
   await checkAgentLimit(agentState.useId,'coding')
    const intent =  getAgentModel('chat') // for now we will use chat agent to get the intent
   const intentResponse =  await intent.invoke(agentPrompts.intentPrompt(agentState.prompt))
   console.log('intentResponse', intentResponse.content)
   const codingLlm =   getAgentModel('coding')

   if(intentResponse.content === 'CODE_GENERATION'){
      const data =   await codingLlm.invoke(agentPrompts.codeGenerationPrompt(agentState.prompt))
      const { files } = parseCodeGenResponse(data.content)
       // deduct credits 
    await deductCredits(agentState.userId,'coding')

      return {
      ...agentState,
      aiResponse: 'Code Generated Successfully',
      agent: 'coding',
      artifacts: [
        {
          id: crypto.randomUUID(),
          title:agentState.prompt,
          type: 'CODE',
          files,
        },
      ],
    
     
    }

   }
   // just normal conversation
   const intentContent = intentResponse.content
   const res = await codingLlm.invoke(agentPrompts.intentConversationPrompt(agentState.prompt, intentContent))

   // deduct credits 
   await deductCredits(agentState.userId, 'chat')
 

   return {
        ...agentState,
        aiResponse:res.content,
        artifacts:[],
        agent: 'chat',
   }
} catch (error) {
    if (error.code === 429 && error.data?.message) {
        return {
            ...state,
            agent: 'coding',
            aiResponse: error.data.message
        }
    }
  
      return {
        ...agentState,
        agent: 'coding',
        aiResponse: 'Error generating code'
    }
}

    



}