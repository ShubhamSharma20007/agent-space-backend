import express from 'express'
import { createConversation,getConversations,saveMessage, updateConversation,getMessages} from '../controllers/chat.controller.js'
const router = express.Router()

router.post('/create-conversation', createConversation)
router.get('/get-conversation', getConversations)
router.patch('/update-conversation/:conversationId', updateConversation)
router.post('/save-message', saveMessage)
router.get('/get-messages/:conversationId',getMessages)

export default router