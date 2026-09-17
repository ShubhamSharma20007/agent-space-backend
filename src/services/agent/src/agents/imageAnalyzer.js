import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getAgentModel } from "../utils/llmModels.js"
import fs from 'fs/promises'
import { agentPrompts } from "../prompts/agents.prompt.js";
import deductCredits from "../utils/deductCredit.js";
import { checkAgentLimit } from "../utils/agentLimit.js";
export const imageAnalyzer = async (agentState) => {
    try {
         await checkAgentLimit(agentState.useId,'image')
        let llm = getAgentModel('imageAnalyzer')
        let imageBuffer = await fs.readFile(agentState.file.path);
        const base64Img = imageBuffer.toString('base64')

        const messages = [
            new SystemMessage(agentPrompts.imageAnalyzerSystemPrompt),
            new HumanMessage({
                content: [
                    {
                        type: 'text',
                        text: agentState.prompt || 'analyze this image'
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:${agentState.file.mimetype};base64,${base64Img}`
                        }
                    }

                ]
            })
        ]
        const response = await llm.invoke(messages)

        // deduct credits 
        await deductCredits(agentState.userId, 'image')
       

        return {
            ...agentState,
            aiResponse: response.content,
            agent: 'imageAnalyzer'
        }


    } catch (error) {
        console.log('Error failed to Analyzer img: ', error?.message || error)
         if (error.code === 429 && error.data?.message) {
        return {
            ...state,
            agent: 'image',
            aiResponse: error.data.message
        }
    }
        return {
            ...agentState,
            aiResponse: error?.message || error,
            agent: 'imageAnalyzer'
        }
    } finally {
        await fs.unlink(agentState.file.path)
    }
}