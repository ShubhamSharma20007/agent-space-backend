import axios from "axios"

export const getMessages = async (conversationId) => {
    try {
        const response= await axios.get(`${process.env.CHAT_SERVICE_URL}/get-messages/${conversationId}`)
        return response.data?.data || []
    } catch (error) {
        console.error(error)
        return []
        
    }
}