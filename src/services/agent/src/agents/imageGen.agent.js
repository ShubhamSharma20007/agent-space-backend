import axios from "axios"
import uploadFile from "../config/imagekit.js"
import { agentPrompts } from "../prompts/agents.prompt.js"
import { getAgentModel } from "../utils/llmModels.js"
import deductCredits from "../utils/deductCredit.js"
import { checkAgentLimit } from "../utils/agentLimit.js"
export const imageGenAgent = async (agentState) => {

    // we can use here paid LLM like (Gemini, Openai) right now we are moving free URL
    try {
        await checkAgentLimit(agentState.useId, 'image')
        const llm = getAgentModel("image")
        const imgGenPrompt = agentPrompts.imageGeneratePrompt(agentState.prompt).trim();
        const seed = Math.floor(Math.random() * 1_000_000_000)
        const imgURL = `https://image.pollinations.ai/prompt/${encodeURIComponent(imgGenPrompt)}?seed=${seed}&width=1024&height=1024&nologo=true`

        const response = await axios.get(imgURL, {
            responseType: "arraybuffer"
        })
        const buffer = response.data


        // store in ImageKit
        const bucketImageURL = await uploadFile(buffer)

        // deduct credits 
        await deductCredits(agentState.userId, 'image')
        try {
        } catch (creditErr) {
            console.error('Credit deduction failed for Image:', creditErr.message)
        }


        return {
            ...agentState,
            agent: 'image',
            aiResponse: [
                "🖼️ **Image Generated Successfully**",
                "",
                `![Generated Image](${bucketImageURL})`,
                "",
                `🔽 [Download Image](${bucketImageURL})`
            ].join("\n")
        }

    } catch (error) {
        console.error('Failed to generate image:', error)
         if (error.code === 429 && error.data?.message) {
        return {
            ...state,
            agent: 'image',
            aiResponse: error.data.message
        }
    }
        return {
            ...agentState,
            aiResponse: `❌ Failed to generate image...`
        }

    }

}