import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { catchAsync } from "../utils/catchAsync";
import LoadOrderMapper from '../mappers/orderMapper';

const JWT_SECRET = process.env.JWT_SECRET as string;
const orderMapper = new LoadOrderMapper();

export const isGranted = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    
    // Get user role from token
    const token = req.headers.authorization?.split(' ')[1];
    
    // If token is not found, return forbidden
    if (!token) {
        res.status(401).json({ message: "Non autorisé" });
        return;
    }
    const decodedToken = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    const userRole: string = decodedToken.role;
    const tokenId: number = decodedToken.id;

    // If user role is not found, return forbidden
    if (!userRole) {
        res.status(403).json({ message: "Non autorisé" });
        return;
    }

    // If user role is admin, allow access
    if (userRole === "admin") {
        next();
        return;
    }

    // Routes available to the authenticated user
    
    // If user role is user, check if the user ID matches the token ID
    if (userRole === "user") {

        const method = req.method;
        const path = req.path;

        // Check for POST /orders
        if (method === "POST" && path === "/orders") {
            if (req.body.user_id === tokenId) {
                next();
                return;
            } else {
                res.status(403).json({ message: "Non autorisé" });
                return;
            }
        }

        // Check for POST /orders/:id/items, GET/orders/:id and GET /orders/:id/items
        else if ((method === "GET" || method === "POST") && /^\/(orders|order)\/\d+(\/items)?$/.test(path)) {
            const orderId = parseInt(req.params.id, 10);
            const order = await orderMapper.findById(orderId);
            if (order && order.userId === Number(tokenId)) {
                return next();
            } else {
                res.status(403).json({ message: "Non autorisé" });
                return;
            }
        }

        else{
            const id = parseInt(req.params.id, 10);
            if (id && id !== tokenId) {
                res.status(403).json({ message: "Non autorisé" });
                return;
            }
            next();
            return;
        }
        
    }    
});