import crypto from "crypto";
import firebaseAdmin from "../config/firebase.js";
import { getAuth } from "firebase-admin/auth";
import User from "../models/user.model.js";
import ApiResponse from "../shared/apis/ApiResponse.js";
import redisClient from "../shared/config/redis.config.js";
import {COST} from '../utils/tokenCost.js'
import { SESSION_COOKIE_NAME,COOKIE_OPTIONS } from "../const/cookieOptions.js";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

// keeps the Redis session copy in sync with the DB
const syncSessionCache = async (user) => {
    const sessionId = await redisClient.get(`user_session:${user._id}`);
    if (!sessionId) return;
    const raw = await redisClient.get(`session:${sessionId}`);
    if (!raw) return;
    await redisClient.set(
        `session:${sessionId}`,
        JSON.stringify({
            ...JSON.parse(raw),
            planId: user.planId,
            credits: user.credits,
            totalCredits: user.totalCredits,
            planExpiresAt: user.planExpiresAt,
            isFreeEnd: user.isFreeEnd,
        }),
        "PX",
        SESSION_TTL_MS
    );
};


export const login = async (req, res, next) => {
  const token = req.body?.token ?? req.query?.token;
  console.log("Received token:", token); // Debugging line
  try {
    if (!token) {
      return res
        .status(400)
        .json(ApiResponse.error("Token is required", 400));
    }

    const decodedToken = await getAuth(firebaseAdmin).verifyIdToken(token);

    if (!decodedToken) {
      return res
        .status(401)
        .json(ApiResponse.error("Invalid token", 401));
    }

    let user = await User.findOne({
      firebaseUUID: decodedToken.uid,
    });

    if (!user) {
      user = new User({
        firebaseUUID: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
      });

      await user.save();
    }

    const sessionId = crypto.randomUUID();
        // at login, alongside the existing session:${sessionId} set
    await redisClient.set(`user_session:${user._id}`, sessionId, 'PX', 1000 * 60 * 60 * 24 * 7);
    await redisClient.set(`session:${sessionId}`, JSON.stringify({
      userId: user._id,
      firebaseUUID: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
       planId:user.planId,
        credits:user.credits,
        totalCredits:user.totalCredits,
        planExpiresAt:user.planExpiresAt,
        isFreeEnd:user.isFreeEnd
    }), 'PX', 1000 * 60 * 60 * 24 * 7); // 7 days PX take millisecond Ex take in second

    // res.cookie("session", sessionId, { 
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: process.env.NODE_ENV === "production"? 'none':"lax",
    //   maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    // });

     res.cookie(SESSION_COOKIE_NAME, sessionId, COOKIE_OPTIONS);
    return res
      .status(200)
      .json(
        ApiResponse.success("Login successful", {
          sessionId,
          user,
        })
      );
  } catch (error) {
    next(error);
  }
};


export const signout = async (req, res, next) => {
  try {
    const { session:sessionId } = req.cookies;
  

    if (!sessionId) {
      return res
        .status(401)
        .json(ApiResponse.error("Invalid session", 401));
    }

    await redisClient.del(`session:${sessionId}`);  
      res.clearCookie(SESSION_COOKIE_NAME);

    return res
      .status(200)
      .json(ApiResponse.success("Logout successful"));
  } catch (error) {
    next(error);
  }
};




export const updateUserPayment = async (req, res, next) => {
    try {
        const { planId, credits, userId } = req.body;

        if (!userId || !planId || !Number.isFinite(credits) || credits <= 0) {
            return res.status(400).json(ApiResponse.error("Invalid payload", 400));
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    planId,
                    planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    isFreeEnd: true,
                },
                $inc: { credits, totalCredits: credits },
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json(ApiResponse.error("User not found", 404));
        }

        await syncSessionCache(user);
        return res.status(200).json(ApiResponse.success("User updated successfully", user));
    } catch (error) {
        next(error);
    }
};

export const deductCredits = async (req, res, next) => {
    try {
        const { userId, agent } = req.body;

        const requiredCost = COST[agent];
        if (requiredCost === undefined) {
            return res.status(400).json(ApiResponse.error(`Unknown agent type: ${agent}`, 400));
        }

        // one atomic operation: only deducts if enough credits exist
        const user = await User.findOneAndUpdate(
            { _id: userId, credits: { $gte: requiredCost } },
            { $inc: { credits: -requiredCost } },
            { new: true }
        );

        if (!user) {
            const exists = await User.exists({ _id: userId });
            return exists
                ? res.status(400).json(ApiResponse.error("Insufficient credits", 400))
                : res.status(404).json(ApiResponse.error("User not found", 404));
        }

        await syncSessionCache(user);
        return res.status(200).json(ApiResponse.success("Credits deducted successfully", user));
    } catch (error) {
        next(error);
    }
};