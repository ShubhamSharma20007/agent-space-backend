import { checkAgentLimit } from "../utils/agentLimit.js"
import deductCredits from "../utils/deductCredit.js"
import { getAgentModel } from "../utils/llmModels.js"
import axios from "axios"
export const searchAgent = async (agentState) => {
  console.log('CALLING SEARCH AGENT...')
  try {
    await checkAgentLimit(agentState.useId, 'search')
    const llm = getAgentModel('search')
    const responses = await llm.invoke({
      query: agentState.prompt
    })

    const trimmedResults = (responses.results || [])
      .slice(0, 5) // hard cap on number of results
      .map(r => ({
        title: r.title,
        url: r.url,
        content: (r.content || '').slice(0, 500), // cap each result's text to ~500 chars
      }))

    // deduct credits 
    await deductCredits(agentState.userId, 'search')


    return {
      ...agentState,
      searchResults: trimmedResults || [],
      images: (responses.images || []).slice(0, 6),
      agent: 'search'
    }

  } catch (error) {
    if (error.code === 429 && error.data?.message) {
      return {
        ...state,
        agent: 'search',
        aiResponse: error.data.message
      }
    }
    return {
      ...agentState,
      searchResults: [],
      images: [],
      agent: 'search'
    }

  }
}