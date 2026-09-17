import axios from 'axios'
import { graph } from '../graph/graph.js';
import ApiResponse from '../shared/apis/ApiResponse.js';
import { addMessage } from '../utils/memory.js';





export const agent = async(req,res,next)=>{
    const { msgState, conversationId, agentId } = req.body;
    const { content: prompt } = JSON.parse(msgState);
    const userId = req.headers['x-user-id']
    const file = req.file ?? null;


    try{

        // add the message in redis (user)
        await addMessage({conversationId, content:prompt,role:'user'})

        await axios.post(process.env.CHAT_SERVICE_URL+'/save-message', {conversationId, content:prompt,role:'user'})

        const result = await graph.invoke({
            prompt,
            conversationId,
            agent:agentId,
            userId,
            file
        })
      console.log('FINAL STATE AGENT:',result)

        //  save the ai response
        await axios.post(process.env.CHAT_SERVICE_URL+'/save-message', {conversationId, content:result.aiResponse,role:'assistant',images:result.images,artifacts:result.artifacts})

            // add the message in redis (user)
        await addMessage({conversationId, content:result.aiResponse,role:'assistant'})
        
        res.status(200).json(new ApiResponse(200,'agent call graph',{
            role:"assistant",
            content:result.aiResponse,
            createdAt: new Date().toISOString(),
            images:result.images || [],
            artifacts:result.artifacts || [],
            agentId:result.agent

        }))
    }catch(err){
        console.log(err)
        // const errorMessage = err?.response?.data?.error || "Unable to process request.Please check your backend logs..."
        // try {
        //     await axios.post(process.env.CHAT_SERVICE_URL+'/save-message', {
        //         conversationId,
        //         content: errorMessage,
        //         role: 'assistant'
        //     })
        // } catch (saveError) {
        //     console.error('Failed to save agent error message:', saveError)
        // }
        next(err)
    }
}