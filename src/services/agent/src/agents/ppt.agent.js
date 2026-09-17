import uploadFile from "../config/imagekit.js";
import { agentPrompts } from "../prompts/agents.prompt.js";
import { checkAgentLimit } from "../utils/agentLimit.js";
import deductCredits from "../utils/deductCredit.js";
import { generatePPT } from "../utils/generatePPT.js";
import { getAgentModel } from "../utils/llmModels.js"
import axios from "axios"
export const pptAgent = async (agentState) => {
    try {
         await checkAgentLimit(agentState.useId,'ppt')
        const llm = getAgentModel('ppt');
        const prompt = agentPrompts.pptGeneratePrompt(agentState.prompt);
        const response = await llm.invoke(prompt);
        let pptData
        try {
            pptData = JSON.parse(response.content)
        } catch (parseError) {
            throw new Error('Failed to parse PPT data from model response: ' + parseError.message)
        }

        console.log({ pptData })

        // generate PPT
        const pptBuffer = await generatePPT(pptData);
        console.log({ pptBuffer })
        const pptLink = await uploadFile(pptBuffer, 'pptx')

        // deduct credits 
        await deductCredits(agentState.userId, 'ppt')
       
        return {
            ...agentState,
             agent:'ppt',
            aiResponse: [
                "**PPT Generated**",
                "",
                `${pptData.title || ''}`,
                "",
                `🔽 [Download PPT](${pptLink})`
            ].join("\n")
        }

    } catch (error) {
        console.log('PPT generate Error: ', error?.message || error)
         if (error.code === 429 && error.data?.message) {
        return {
            ...state,
            agent: 'ppt',
            aiResponse: error.data.message
        }
    }
        return {
            ...agentState,
            aiResponse: 'Error generating PPT: ' + (error?.message || error)
        }
    }
}