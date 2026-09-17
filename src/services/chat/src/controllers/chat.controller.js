import Conversation from "../models/coversation.model.js"
import ApiResponse from "../shared/apis/ApiResponse.js"
import Message from "../models/message.model.js"
export const createConversation = async (req, res,next) => {
    try {
        const userId = req.headers['x-user-id']

        const conversation = await Conversation.create({userId})
        return res.status(201).json(ApiResponse.success("Conversation created successfully",conversation,201))

    } catch (error) {
        next(error)
        
    }

}


export const getConversations = async (req, res,next) => {
    try {
        const userId = req.headers['x-user-id']
        const conversations = await Conversation.find({userId}).sort({updatedAt:-1})
        return res.status(200).json(ApiResponse.success("Conversation fetched successfully",conversations,200))

    } catch (error) {
        next(error)
        
    }

}


export const updateConversation = async (req, res,next) => {
    try {
        const {conversationId}= req.params;
        const {title} = req.body;
        const conversations = await Conversation.findByIdAndUpdate(conversationId,{title:title},{new:true})
        return res.status(200).json(ApiResponse.success("Conversation updated successfully",conversations,200))

    } catch (error) {
        next(error)
        
    }

}


export const saveMessage = async (req, res,next) => {
    try {
        const {conversationId, content,role,images,artifacts} = req.body
        console.log({
            'SAVE MESSAGE BODY':req.body
        })
        const conversation = await Message.create({
            conversationId,
            content,
            role,
            images,
            artifacts
        })
        return res.status(200).json(ApiResponse.success("Message saved successfully",conversation,200))

    } catch (error) {
        next(error)

    }
}


export const getMessages = async (req, res,next) => {
    try {
        const {conversationId} = req.params
        const messages = await Message.find({conversationId}).sort({createdAt:1})
        return res.status(200).json(ApiResponse.success("Messages fetched successfully",messages,200))

    } catch (error) {
        next(error)

    }
}