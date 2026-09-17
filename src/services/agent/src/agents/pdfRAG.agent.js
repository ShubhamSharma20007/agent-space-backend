import fs from 'fs/promises'
import { PDFParse } from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import createVectorStore from '../utils/vectorDB.js';
import { getAgentModel } from '../utils/llmModels.js';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { agentPrompts } from '../prompts/agents.prompt.js';
import deductCredits from '../utils/deductCredit.js';
import { checkAgentLimit } from '../utils/agentLimit.js';


const searchWithRetry = async (store, prompt, sourceId, maxAttempts = 5, delayMs = 800) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const docs = await store.similaritySearch(prompt, 5, {
            preFilter: { 'sourceId': sourceId }
        });
        if (docs.length > 0) return docs;
        console.log(`similaritySearch attempt ${attempt}: no results yet, retrying...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    return []; 
};

export const pdfRAG = async (agentState) => {
    try {
         await checkAgentLimit(agentState.useId,'pdf')
        const buffer = await fs.readFile(agentState.file.path)
        const pdf = new PDFParse({
            data: buffer
        });
        const result = await pdf.getText();
        const text = result.text;

        console.log('PDF TEXT: ', text)

        //  Split the text in chunk's
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 })

        const docs = await splitter.createDocuments([text]);
        const sourceId = `${agentState.userId}-${Date.now()}`;
        const store = await createVectorStore(docs, sourceId)

        // similar result 
        const relevantDocs = await searchWithRetry(store, agentState.prompt, sourceId);

        console.log('RAG RELEVANT DOCS:',relevantDocs)

        const context = relevantDocs.length > 0
            ? relevantDocs.map(doc => doc.pageContent).join('\n\n')
            : text // fallback


        const llm = getAgentModel('pdfRAG')

        const messages = [
            new SystemMessage(agentPrompts.pdfRAGSystemPrompt),
            new HumanMessage(`
            Context: ${context}

            Question: ${agentState.prompt}
            `)
        ]

        const response = await llm.invoke(messages)


        // deduct credits 
        await deductCredits(agentState.userId, 'pdf')
  
        return {
            ...agentState,
            aiResponse: response.content,
            agent: "pdfRAG"
        }

    } catch (error) {
        console.log('Error in pdfRAG agent: ', error)
         if (error.code === 429 && error.data?.message) {
        return {
            ...state,
            agent: 'pdfRAG',
            aiResponse: error.data.message
        }
    }
        return {
            ...agentState,
            aiResponse: 'Error generating PDF: ' + (error?.message || error),
            agent: "pdfRAG"
        }


    } finally {
        await fs.unlink(agentState.file.path)
    }
}