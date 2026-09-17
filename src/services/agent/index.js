import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import dns from "dns";

import connectDB from "./src/config/connectDB.js";
import agentRouter from "./src/routes/agent.route.js";
import { globalErrorMiddleware } from "./src/shared/middlewares/globalErrorMiddleware.js";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

await connectDB();
// console.log(vectorStore(3,2),234234)


const app = express();

const PORT = process.env.PORT;

app.use(express.json({
    limit:'50mb'
}));
app.use(express.urlencoded({ limit: '50mb',extended: true }));

app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));

app.get("/index", (req, res) => {
    res.send("Agent Service Index");
});

app.use("/", agentRouter);

app.use(globalErrorMiddleware);

app.listen(PORT, () => {
    console.log(
        `Server (Agent_Service_Module) is running on port ${PORT}`
    );
});