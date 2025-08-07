import { NextFunction, Request, Response } from "express";
import { orderSchema, orderUpdateSchema } from "../utils/shemasJoi";
import { AppError } from "../middlewares/errorHandler";
import { catchAsync } from "../utils/catchAsync";
import loadOrderMapper from "../mappers/orderMapper";
import { sanitizeInput } from '../utils/sanitizeInput';
import { Order } from '../types/index';

const orderMapper = new loadOrderMapper();

const orderController = {

  // ALL ORDERS

  orders: catchAsync(async (req:Request, res:Response, next:NextFunction): Promise<void | Response> => {

    const limit = parseInt(req.query.limit as string, 10) || 10;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const withCount = req.query.withCount === 'true';

    let orders: Order[] = [];
    let total: number | undefined;

    if (withCount) {
        const result = await orderMapper.findAllWithCount(limit, offset);
        orders = result.data;
        total = result.total;
    }else {
        orders = await orderMapper.findAll(limit, offset);
    }

    if (!orders || orders.length === 0) {
      return next(new AppError("No orders found", 404)); 
    }

    if (withCount) {
      return res.status(200).json({ orders, total });
    }

    res.status(200).json(orders);
  }),

  ordersByUserId: catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id, 10);
    if (id === null) {
      return next(new AppError("Invalid user ID", 400));
    }
    const orders = await orderMapper.findByField("user_id", id);
    res.status(200).json(orders);
  }),

  // ONE ORDER

  orderById: catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return next(new AppError("Invalid order ID", 400));
    }

    const order = await orderMapper.findById(id);
    if (!order) {
      return next(new AppError(`Order ${id} not found`, 404));
    }
    res.status(200).json(order);
 }),

  orderByIdWithUser: catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id, 10);

    const order = await orderMapper.findByIdWithUser(id);
    if (!order) {
      return next(new AppError(`Order ${id} not found`, 404));
    }
    res.status(200).json(order);
  }),

  // POST AND PATCH

  addOrder: catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const sanitizedBody = sanitizeInput(req.body);
    const { error, value } = orderSchema.validate(sanitizedBody);

    if (error) {
      return next(new AppError(`Invalid data`, 400));
    }

    const existingOrder = await orderMapper.findById(value.id);
    if (existingOrder) {
      return next(new AppError(`Order ${value.id} already exists`, 409));
    }

    const newOrder = await orderMapper.create(value);
    console.log("Value:", value);
    res.status(201).json(newOrder);
  }),

  updateOrder: catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    
    const id = parseInt(req.params.id, 10);
    const sanitizedBody = sanitizeInput(req.body);
    const { error, value } = orderUpdateSchema.validate(sanitizedBody);
    
    if (error) {
      return next(new AppError(`Invalid data`, 400));
    }

    const existingOrder = await orderMapper.findById(id);
    if (!existingOrder) {
      return next(new AppError(`Order ${id} not found`, 404));
    }

    const updatedOrder = await orderMapper.update(id, value);
    res.status(200).json(updatedOrder);
  }),

};

export default orderController;
