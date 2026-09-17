import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()
async function deductCredits(userId,agent){
    const response = await axios.post(process.env.AUTH_SERVICE_URL+'/deduct-credit', {userId, agent})
    return response.data
}
export default deductCredits