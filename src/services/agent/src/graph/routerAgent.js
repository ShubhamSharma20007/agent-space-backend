import { agentPrompts } from "../prompts/agents.prompt.js"
import { getAgentModel } from "../utils/llmModels.js"
import logger from "../utils/logger.js"
import axios from 'axios'
export const routerAgent = async(agentState) => {
    logger.info({'Agent State':agentState})

    // if the agent id auto no need to detect
    if (agentState.agent && agentState.agent !== 'auto') {
        return {
            ...agentState,
            agent: agentState.agent,
        }
    }


    if(agentState.file && agentState.file.mimetype === 'application/pdf'){
        return {
            ...agentState,
            agent:'pdfRAG'
        }
    }

    if( agentState.file && agentState.file.mimetype.startsWith('image/')){
        return {
            ...agentState,
            agent:'imageAnalyzer'
        }
    }

    // url scrapper
     const urlMatch = agentState.prompt?.match(/https?:\/\/[^\s)]+/i)
    if (urlMatch) {
        return {
            ...agentState,
            agent: 'urlScrapper',
            url: urlMatch[0],
        }
    }


    // this is case of running auto model

    const llm =  getAgentModel('router') // fallback for detect correct model
    const prompt =agentPrompts.agentDetection(agentState.prompt)

    const response = await llm.invoke(prompt)
    const detectedAgent = response.content
        .toString()
        .toLowerCase()
        .match(/chat|search|coding|pdf|ppt|image/)?.[0] || 'chat'

    logger.info({ detectedAgent, rawResponse: response.content }, 'AGENT DETECTION')

   


    return {
        ...agentState,
        agent: detectedAgent
    }

}