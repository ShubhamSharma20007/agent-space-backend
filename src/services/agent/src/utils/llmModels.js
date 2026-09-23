import dotenv from "dotenv"
dotenv.config()
import { agentModelNames } from "../const/models.js"
import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { TavilySearch } from "@langchain/tavily";
import { ChatOpenRouter } from "@langchain/openrouter";

const openRouterLLM = new ChatOpenRouter({
  model: "deepseek/deepseek-chat",
  temperature: 0,
  maxTokens: 2500,
  apiKey:process.env.OPENROUTER_API_KEY
});


const groqLLM = new ChatGroq({
    model: agentModelNames.chatAgent,
    apiKey:process.env.GROQ_API_KEY,
})

const geminiLLM = new ChatGoogleGenerativeAI({
    model: agentModelNames.searchAgent,
    apiKey:process.env.GEMINI_API_KEY,
    maxRetries: 2,
})

const searchLLM = new TavilySearch({
  maxResults: 5,
  topic: "general",
  apiKey: process.env.TAVILY_API_KEY,
  includeImages: true,
  // includeAnswer: false,
  includeRawContent: false,
  // includeImageDescriptions: false,
  // searchDepth: "basic",
  // timeRange: "day",
  // includeDomains: [],
  // excludeDomains: [],
});




export const getAgentModel = (modelName)=>{
    console.log("MODEL NAME",modelName)
    switch(modelName){
        case 'chat':
            return groqLLM
        case 'search':
            return searchLLM
        case 'coding':
            return openRouterLLM
        case 'imageAnalyzer':
            return geminiLLM
        case 'pdfRAG':
            return geminiLLM
        default:
            return groqLLM
    }
}
