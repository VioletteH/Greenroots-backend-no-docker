import { pool } from './db';
import BaseMapper from './baseMapper';
import { AppError } from '../middlewares/errorHandler';

export default class ItemMapper extends BaseMapper<any> {
	constructor() {
		super('order_item');
	}

    async updatedStock(treeId: number, forestId: number, quantity: number): Promise<Number> {
            const query = `
                UPDATE forest_tree
                SET stock = stock - $1
                WHERE tree_id = $2 AND forest_id = $3
            `;
            const values = [quantity, treeId, forestId];
            const { rowCount } = await pool.query(query, values);
            
            if (rowCount === 0){
                throw new AppError('Stock not updated', 400);
            } 
            
            return rowCount ?? 0;
    }

}