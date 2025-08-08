import express from 'express';
import path from 'path';
import routes from './app/routes/index';
import { errorHandler } from './app/middlewares/errorHandler';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = 3000;

const allowedOrigins = [
  process.env.BACKOFFICE,
  process.env.FRONTA,
  process.env.FRONTB,
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Appliquer CORS uniquement pour les images dans /uploads
app.use('/uploads', cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.BACKOFFICE,
      process.env.FRONTA,
      process.env.FRONTB,
      'https://greenrooters.netlify.app' 
    ].filter(Boolean); 

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS blocked on /uploads: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  }
}), express.static(path.join(__dirname, 'public', 'uploads'))); 


app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://js.stripe.com", 
          "'unsafe-inline'" 
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "blob:", "http://localhost:3001", "http://localhost:5173", "http://localhost:5174", "https://greenroots-backend-no-docker.onrender.com", "https://greenrooters.netlify.app"], // autoriser les images locales et base64
        connectSrc: ["'self'", "https://api.stripe.com"], 
        frameSrc: ["'self'", "https://js.stripe.com"], 
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(routes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Example app listening on port http://localhost:${PORT}`);
});
