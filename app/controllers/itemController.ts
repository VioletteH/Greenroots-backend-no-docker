import { NextFunction, Request, Response } from "express";
import { AppError } from "../middlewares/errorHandler";
import { catchAsync } from "../utils/catchAsync";
import BaseMapper from "../mappers/baseMapper";
import loadItemMapper from "../mappers/itemMapper";

const baseMapper = new BaseMapper("order_item");
const itemMapper = new loadItemMapper();

const itemController = {

  itemsByOrderId: catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const id = parseInt(req.params.id, 10);
  
    if (id === null || isNaN(id)) {
      return next(new AppError("Invalid user ID", 400));
    }

    const items = await itemMapper.findByField("order_id", id);
    res.status(200).json(items);
  }),

  addOrderItem: catchAsync(async (req: Request, res: Response, next: NextFunction) => {

      const orderId = Number(req.params.id);
      const data = { ...req.body, order_id: orderId };
      
      const addOrderItemResult = await baseMapper.create(data);

      if (!addOrderItemResult) {
        return next(new AppError(`Order item not created`, 400));
      }
    
      await itemMapper.updatedStock(Number(data.tree_id), Number(data.forest_id), Number(data.quantity));

      res.status(201).json(addOrderItemResult)
    }),
  }

export default itemController;
