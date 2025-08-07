import { snakeToCamel } from '../utils/toggleCase';
import BaseMapper from './baseMapper';
import { pool } from './db';

export default class OrderMapper extends BaseMapper<any> {
    constructor() {
        super('order');
    }

    async findByIdWithUser(id: number): Promise<any | null> {
        const query = `
            SELECT 
                o.id AS order_id,
                o.total_price,
                o.status,
                o.created_at,
                o.updated_at,
                u.firstname,
                u.lastname,
                u.email,
                oi.id AS item_id,
                oi.name AS item_name,
                oi.price AS item_price,
                oi.quantity AS item_quantity
            FROM "order" o
            JOIN "user" u ON o.user_id = u.id
            LEFT JOIN "order_item" oi ON o.id = oi.order_id
            WHERE o.id = $1
        `;
        
        const { rows } = await pool.query(query, [id]);
        console.log('ROWS FULL ORDER', rows);
        if (rows.length === 0) return null;
        
        const first = snakeToCamel(rows[0]);

        const order = {
            id: first.orderId,
            totalPrice: parseFloat(first.totalPrice),
            status: first.status,
            createdAt: first.createdAt,
            updatedAt: first.updatedAt,
            user: {
                firstname: first.firstname,
                lastname: first.lastname,
                email: first.email
            },
            items : rows.map(row => ({
                name: row.item_name,
                price: row.item_price,
                quantity: row.item_quantity
            }))
        };
    
        return order;
    }
}