// Is tarike se import karein
import * as winston from 'winston'; 

// Ya phir specific function ko destruct karein
// import { createLogger, transports, format } from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export { logger }; // Isse export karna mat bhulna