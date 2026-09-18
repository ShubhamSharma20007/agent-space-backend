import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';
import { globalErrorMiddleware } from './shared/middlewares/globalErrorMiddleware.js';
import cookieParser from 'cookie-parser';
import protectAuthRoute from './middleware/auth.middlware.js';
import { getCurrentUser } from './controllers/user.controller.js';
import proxyWithHeader from './utils/proxyHeader.js';
import dns from 'dns'
import ApiResponse from './shared/apis/ApiResponse.js';
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const PORT = process.env.PORT
const app = express();

app.use(express.urlencoded({ limit: '50mb',extended: true }));

app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

const authProxy = proxy(process.env.AUTH_SERVICE_URL,{limit:'50mb'});
const chatProxy = proxyWithHeader(process.env.CHAT_SERVICE_URL);
const agentProxy = proxyWithHeader(process.env.AGENT_SERVICE_URL);
const billingProxy = proxyWithHeader(process.env.BILLING_SERVICE_URL);
const PUBLIC_AUTH_PATHS = ['/signin', '/signout']
app.use(cookieParser());
app.use(express.json({
    limit:'50mb'
}));


app.use('/api/auth',(req,res,next)=>{
    if(PUBLIC_AUTH_PATHS.includes(req.path)) return next();
    return res.status(404).json(ApiResponse({message:'Not Found'},404))
},authProxy);
app.use('/api/chat',protectAuthRoute ,chatProxy);
app.use('/api/agent',protectAuthRoute ,agentProxy);
app.use('/api/billing',protectAuthRoute ,billingProxy);

//  self define routes
app.get('/api/', (req, res) => res.send('Gateway Index'));


app.get('/api/user',protectAuthRoute, getCurrentUser);


// error handler
app.use(globalErrorMiddleware);




app.listen(PORT, () => {
    // console.log('Listening on port', PORT);
    console.log(`Server (Gateway_Module) is running on port ${PORT}`);
})




