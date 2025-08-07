import { NextFunction, Request, Response } from 'express';
import argon2 from 'argon2';
import { sanitizeInput } from '../utils/sanitizeInput';
import { userSchema, userUpdateSchema, userUpdateSchemaBackOffice } from '../utils/shemasJoi';
import AuthMapper from '../mappers/authMapper';
import UserMapper from '../mappers/userMapper';
import { User } from '../types/index';
import { AppError } from '../middlewares/errorHandler';
import { catchAsync } from '../utils/catchAsync';

const userMapper = new UserMapper();
const userAuthMapper = new AuthMapper();

const userController = {   

    // ALL USERS

    users: catchAsync(async (req:Request, res:Response, next:NextFunction): Promise<void | Response> => {
        
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const offset = parseInt(req.query.offset as string, 10) || 0;
        const withCount = req.query.withCount === 'true';
    
        let users: User[] = [];
        let total: number | undefined;

        if (withCount) {
            const result = await userMapper.findAllWithCount(limit, offset);
            users = result.data;
            total = result.total;
        }else {
            users = await userMapper.findAll(limit, offset);
        }
 
        if (!users || users.length === 0) {
            return next(new AppError("No users found", 404)); 
        }

        if (withCount) {
            return res.status(200).json({ users, total });
        }

        res.status(200).json(users);
    }),

    // ONE USER

    userById: catchAsync(async (req:Request, res:Response, next: NextFunction) => {

        const id = parseInt(req.params.id, 10);

        const user = await userMapper.findById(id);
        if (!user) {
            return next(new AppError(`User with ${id} not found`, 404));
        }

        res.status(200).json(user);
    }),

    impactByUserId: catchAsync(async (req:Request, res:Response, next: NextFunction) => {

        const id = parseInt(req.params.id, 10);

        const user = await userMapper.findById(id);
        if (!user) {
            return next(new AppError(`User with ${id} not found`, 404));
        }

        const impact = await userMapper.userImpact(id);

        res.status(200).json(impact);
    }),

    // POST, PATCH & DELETE

    addUser: catchAsync(async (req:Request, res:Response, next: NextFunction) => {
        
        // step 1 - data validation
        const sanitizedBody = sanitizeInput(req.body);
        const { error, value } = userSchema.validate(sanitizedBody);
        if (error) {
            const messages = error.details.map(detail => detail.message);
            return next(new AppError(messages.join(', '), 400));
        }

        // step 2 - find if user already exists
        const user = await userAuthMapper.findByEmail(value.email) as User; 
        if (user) {
            return next(new AppError ("User already exists", 400));
        }

        // step 3 - hash password
        const hashedPassword = await argon2.hash(value.password);

        // step 4 - create user
        const newUser = await userMapper.create({ ...value, password: hashedPassword });

        // step 5 - send data
        res.status(201).json(newUser);
    }),

    updateUser: catchAsync(async (req: Request, res: Response, next: NextFunction) => {
 
        const id = parseInt(req.params.id, 10);
        const isBackOffice = req.query.backoffice === 'true'; 
        const sanitizedBody = sanitizeInput(req.body);

        // Schema selection based on context
        const schema = isBackOffice ? userUpdateSchemaBackOffice : userUpdateSchema;
        const { error, value } = schema.validate(sanitizedBody);
    
        if (error) {
            const messages = error.details?.map(detail => detail.message).join(', ') || 'Invalid update data';
            return next(new AppError(messages, 400));
        }
    
        // Check if user exists
        const existingUser = await userMapper.findById(id);
        if (!existingUser) {
            return next(new AppError(`User with id ${id} not found`, 404));
        }
    
        // Password hashing
        if (!isBackOffice && value.password) {
            value.password = await argon2.hash(value.password);
        }
    
        const updatedUser = await userMapper.update(id, value);
        
        res.status(200).json(updatedUser);
    }),
    
    deleteUser: catchAsync(async (req:Request, res:Response, next: NextFunction) => {
        
        const id = parseInt(req.params.id, 10);

        const user = await userMapper.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const hasOrders = await userMapper.hasOrders(id);
        if (hasOrders) {
            return res.status(400).json({
            message: "Impossible de supprimer cet utilisateur car il est lié à une ou plusieurs commandes.",
            });
        }

        await userMapper.delete(id);

        res.status(200).send("User deleted");
    }),
    
}
export default userController;