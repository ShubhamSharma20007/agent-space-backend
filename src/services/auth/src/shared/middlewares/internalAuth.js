import crypto from "crypto";
import ApiResponse from "../apis/ApiResponse.js";

export const requireInternalKey = (req, res, next) => {
    const expected = process.env.INTERNAL_API_KEY;
    const provided = req.headers["x-internal-key"];
    
    if (!expected || typeof provided !== "string") {
        return res.status(401).json(ApiResponse.error("Unauthorized", 401));
    }

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(401).json(ApiResponse.error("Unauthorized", 401));
    }
    next();
};