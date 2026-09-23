import redisClient from "../shared/config/redis.config.js";

const LIMIT = {
    chat: 10,
    search: 5,
    coding: 5,
    pdf: 5,
    ppt: 5,
    image: 5,
    urlScrapper: 5
}


export const checkAgentLimit = async (userId, agent) => {
    try {
        const max = LIMIT[agent] || LIMIT['free'];
        if (max === undefined) {
            const error = new Error(`Unknown agent type for rate limiting: ${agent}`);
            error.code = 400;
            throw error;
        }
        const key = `rate:${userId}:${agent}`;
        const count = await redisClient.incr(key);
        if (count === 1) {
            await redisClient.expire(key, 60) // 60 seconds
        }
        const ttl = await redisClient.ttl(key); // give me time 
        if (count > max) {
            const minutes = Math.floor(ttl / 60);
            const seconds = (ttl % 60);
            const time = minutes > 0 ? `${minutes}s` : `${seconds}s`;
            const error = new Error(`Rate limit Exceeded for ${agent}`);
            error.code = 429;
            error.data = {
                success: false,
                agent,
                limit: max,
                retryAfterSeconds: ttl,
                retryAfter: time,
                message: `You have reached the ${agent} limit (${max} request per minute). Try again in ${time}.`
            }
            throw error

        }
        return {
            remaining: max - count,
            limit: max
        }
    } catch (error) {
        throw error

    }
}