import dotenv from 'dotenv'
dotenv.config()
import axios from "axios"
import { getAgentModel } from "../utils/llmModels.js"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { agentPrompts } from "../prompts/agents.prompt.js"
import deductCredits from "../utils/deductCredit.js"
import { checkAgentLimit } from "../utils/agentLimit.js"

const URL_REGEX = /https?:\/\/[^\s)]+/i
const scrapeUrl = async (url) => {
    const key = process.env.JINA_API_KEY?.trim()  // guard against stray \r or whitespace
    console.log('JINA KEY LENGTH:', key?.length)

    try {
        const response = await axios.post(
            "https://r.jina.ai/",
            { url },
            {
                headers: {
                    Authorization: `Bearer ${key}`,
                    "Content-Type": "application/json",
                },
                timeout: 20000,
            }
        )
        console.log(response.data,234234234)
        return response.data
    } catch (err) {
        console.error("JINA ERROR STATUS:", err.response?.status)
        console.error("JINA ERROR BODY:", err.response?.data)
        console.error("JINA ERROR HEADERS SENT:", err.config?.headers)
        throw err
    }
}

export const urlScrapperAgent = async (agentState) => {
    try {
        await checkAgentLimit(agentState.userId, "urlScrapper")

        const url = agentState.url || agentState.prompt?.match(URL_REGEX)?.[0]

        if (!url) {
            return {
                ...agentState,
                agent: "urlScrapper",
                aiResponse: "I couldn't find a valid URL in your message. Please share the link you want me to read.",
            }
        }

        const scraped = await scrapeUrl(url)

        // Jina Reader can return a raw markdown string, or { data: { content, title, ... } }
        const scrapedContent =
            typeof scraped === "string"
                ? scraped
                : scraped?.data?.content || scraped?.content || JSON.stringify(scraped)

        const llm = getAgentModel("urlScrapper")

        const messages = [
            new SystemMessage(agentPrompts.urlScrapperSystemPrompt),
            new HumanMessage(`
            URL: ${url}

            Scraped Content:
            ${(scrapedContent || "").slice(0, 12000)}

            Question: ${agentState.prompt}
            `),
        ]

        const response = await llm.invoke(messages)

        // deduct credits
        await deductCredits(agentState.userId, "urlScrapper")

        return {
            ...agentState,
            aiResponse: response.content,
            agent: "urlScrapper",
        }
    } catch (error) {
        console.log("Error in urlScrapper agent: ", error?.message || error)
        if (error.code === 429 && error.data?.message) {
            return {
                ...agentState,
                agent: "urlScrapper",
                aiResponse: error.data.message,
            }
        }
        return {
            ...agentState,
            aiResponse: "Error reading that URL: " + (error?.message || error),
            agent: "urlScrapper",
        }
    }
}