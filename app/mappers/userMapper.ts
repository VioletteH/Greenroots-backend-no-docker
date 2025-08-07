import { snakeToCamel } from '../utils/toggleCase';
import BaseMapper from './baseMapper';
import { pool } from './db';
import { Forest } from '../types/index';

export default class UserMapper extends BaseMapper<any> {
    constructor() {
        super('user');
    }

    async userImpact(id : number): Promise<Forest[]> {
        const query = `
            SELECT
                SUM(t.co2 * oi.quantity) AS total_co2,
                SUM(t.o2 * oi.quantity) AS total_o2
            FROM order_item oi
            JOIN "order" o ON o.id = oi.order_id
            JOIN tree t ON t.id = oi.tree_id
            WHERE o.user_id = $1;
        `;
        const { rows } = await pool.query(query, [id]);
        if (!rows) return []; 
        return rows.map(snakeToCamel) as Forest[];
    }

    async hasOrders(userId: number): Promise<boolean> {
        const { rows } = await pool.query(
          'SELECT 1 FROM "order" WHERE user_id = $1 LIMIT 1',
          [userId]
        );
        return rows.length > 0;
      }
}