import uploadFile from "../config/imagekit.js";
import { agentPrompts } from "../prompts/agents.prompt.js";
import { checkAgentLimit } from "../utils/agentLimit.js";
import deductCredits from "../utils/deductCredit.js";
import { generatePDF } from "../utils/generatePDF.js";
import { getAgentModel } from "../utils/llmModels.js"
export const pdfAgent = async (agentState) => {
    try {
         await checkAgentLimit(agentState.useId,'pdf')
        const llm = getAgentModel('pdf');
        const prompt = agentPrompts.pdfGeneratePrompt(agentState.prompt)
        const response = await llm.invoke(prompt)
        let pdfData
        try {
            pdfData = JSON.parse(response.content)
        } catch (parseError) {
            throw new Error('Failed to parse PDF data from model response: ' + parseError.message)
        }

        // generate PDF
        const pdfBuffer = await generatePDF(pdfData)
         const pdfLink = await uploadFile(pdfBuffer, 'pdf')


         // deduct credits 
         await deductCredits(agentState.userId, 'pdf')
   

        return {
            ...agentState,
             agent:'pdf',
            aiResponse: [
            "**PDF Generated**",
            "",
            `${pdfData.title || ''}`,
            "",
            `🔽 [Download PDF](${pdfLink})`
            ].join("\n")
        }

    } catch (error) {
        console.log('PDF generate Error: ', error?.message || error)
         if (error.code === 429 && error.data?.message) {
        return {
            ...state,
            agent: 'pdf',
            aiResponse: error.data.message
        }
    }
        return {
            ...agentState,
            aiResponse: 'Error generating PDF: '+error?.message || error
        }
    }
}