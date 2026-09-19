import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import connectDB from './src/config/connectDB.js';
import {globalErrorMiddleware} from './src/shared/middlewares/globalErrorMiddleware.js'
import cors from 'cors';
import chatRouter from './src/routes/chat.route.js'
import dns from 'dns'
dns.setServers(["8.8.8.8", "1.1.1.1"])
await connectDB();
const app = express();
const PORT = process.env.PORT 

app.use(express.json({
    limit:'50mb'
}));
app.use(express.urlencoded({ limit: '50mb',extended: true }));

app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  }));
  




app.get('/index', (req, res) => {
    res.send('Chat Service Index');
});


app.use('/',chatRouter)

// error middleware
app.use(globalErrorMiddleware)

app.listen(PORT, () => {
    console.log(`Server (Chat_Service_Module) is running on port ${PORT}`);
})




