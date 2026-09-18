import redisClient from '../shared/config/redis.config.js'
import ApiResponse from "../shared/apis/ApiResponse.js";
const protectAuthRoute = async (req, res, next) => {
    try {
        const sessionId = req.cookies?.session || req.headers?.session;
        if (!sessionId) {
            return res.status(401).json(ApiResponse.error("Invalid session", 401));
        }

        const user = await redisClient.get(`session:${sessionId}`);
        if (!user) {
            return res.status(401).json(ApiResponse.error("Invalid session", 401));
        }

        console.log('Authenticated user: ',user)
        
        req.user = JSON.parse(user);
        next()
        
    } catch (error) {
        next(error)
    }
}

export default protectAuthRoute;