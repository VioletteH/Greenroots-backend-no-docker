
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { sanitizeInput } from '../utils/sanitizeInput';
import { catchAsync } from '../utils/catchAsync';
import { loginSchema, registerSchema } from '../utils/shemasJoi';
import { AppError } from '../middlewares/errorHandler';
import AuthMapper from '../mappers/authMapper';
import type { User} from '../types/index';

const JWT_SECRET = process.env.JWT_SECRET as string;
const authMapper = new AuthMapper();

const authController = {   
    
    login: catchAsync(async (req: Request, res: Response, next:NextFunction ): Promise<void>  => {
        
        // One message for all errors for security reasons 

        // step 1 - data validation
        const sanitizedBody = sanitizeInput(req.body);
        const { error, value } = loginSchema.validate(sanitizedBody);
        if (error) {
            return next(new AppError ("Email ou mot de passe invalide", 400));
        }

        // step 2 - find user
        const user = await authMapper.findByEmail(value.email) as User;
        if (!user) {
            return next(new AppError ("Email ou mot de passe invalide", 401));
        }

        // step 3 - verify password 
        const passwordValid = await argon2.verify(user.password, value.password);
        if (!passwordValid) {
            return next(new AppError ("Email ou mot de passe invalide", 401));
        }

        // step 4 - generate JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        // step 5 - prepare user data & send
        const { password, createdAt, updatedAt, ...userData } = user;
        res.status(200).json({message: 'Login ok !', token, user: userData});
    }),
    
    register: catchAsync(async(req:Request, res:Response, next: NextFunction) : Promise<void> => {
        
        // step 1 - data validation
        const sanitizedBody = sanitizeInput(req.body);
        const { error, value } = registerSchema.validate(sanitizedBody);
        // Error messages extraction from schemasJoi
        if (error){
            const messages = error.details.map(detail => detail.message);
            console.log(messages);
            return next(new AppError(messages.join(', '), 400));
        }

        // step 2 - find if user already exists
        const user = await authMapper.findByEmail(value.email) as User;
        if (user) {
            return next(new AppError ("L'utilisateur existe déjà", 409));
        }

        // step 3 - hash password
        const hashedPassword = await argon2.hash(value.password);

        // step 4 - create user
        const newUser = await authMapper.create({ ...value, password: hashedPassword });

        // step 5 - generate JWT token
        const token = jwt.sign(
            { id: newUser.id, role: newUser.role, email: newUser.email },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        // step 6 - prepare user data & send
        const { password, createdAt, updatedAt, ...userData } = newUser;
        res.status(201).json({message: 'register ok!', token, user: userData});
    }),
}
export default authController;