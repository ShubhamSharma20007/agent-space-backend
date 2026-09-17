import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import connectDB from './src/config/connectDB.js';
import { globalErrorMiddleware } from './src/shared/middlewares/globalErrorMiddleware.js';
import authRouter from './src/routes/auth.route.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dns from 'dns'
dns.setServers(["8.8.8.8", "1.1.1.1"]);
await connectDB();
const app = express();
const PORT = process.env.PORT || 4001;
app.use(cookieParser());
app.use(express.json({
    limit:'50mb'
}));
app.use(express.urlencoded({ limit: '50mb',extended: true }));

app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }));




app.get('/index', (req, res) => {
    console.log('Auth Service Index route accessed');
    res.send('Auth Service Index');
});

app.use('/', authRouter);




// error middleware
app.use(globalErrorMiddleware)





app.listen(PORT, () => {
    console.log(`Server (Auth_Service_Module) is running on port ${PORT}`);
})




