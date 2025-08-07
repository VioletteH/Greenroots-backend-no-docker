import { pool } from './db';
import BaseMapper from './baseMapper';
import { snakeToCamel } from '../utils/toggleCase';
import { Forest } from '../types/index';

export default class ForestMapper extends BaseMapper<any> {
	constructor() {
		super('forest');
	}

    // ONE FOREST

    async forestWithTreesAndStock(forestId: number): Promise<any> {
        const query = `
            SELECT forest.*,
                array_remove(array_agg(tree.name ORDER BY tree.name), NULL) AS treesName,
                array_remove(array_agg(forest_tree.stock ORDER BY tree.name), NULL) AS stock
            FROM forest
            LEFT JOIN forest_tree ON forest.id = forest_tree.forest_id
            LEFT JOIN tree ON forest_tree.tree_id = tree.id
            WHERE forest.id = $1
            GROUP BY forest.id
        `;
        const { rows } = await pool.query(query, [forestId]);
        if (!rows || rows.length === 0) return null;
        return snakeToCamel(rows[0]);
    }

    // ASSOCIATIONS

    async forestsByTree(id : number): Promise<Forest[]> {
			const query = `
                SELECT DISTINCT f.*, ft.stock
                FROM forest f
                JOIN forest_tree ft ON ft.forest_id = f.id
                WHERE ft.tree_id = $1;
			`;
			const { rows } = await pool.query(query, [id]);
			if (!rows) return []; 
			return rows.map(snakeToCamel) as Forest[];
    }

    // POST AND PATCH

    async addForestToTrees(forestId: number, treeAssociations: { treeId: number, stock: number }[]): Promise<void> {

        if (!treeAssociations || treeAssociations.length === 0) return;

        const query = `
            INSERT INTO forest_tree (forest_id, tree_id, stock)
            VALUES ($1, $2, $3)
        `;
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const {treeId, stock } of treeAssociations) {
                await client.query(query, [forestId, treeId, stock]);
            }
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async updateForestToTrees(forestId: number, treeAssociations: { treeId: number, stock: number }[]): Promise<void> {
        const insertQuery = `
            INSERT INTO forest_tree (forest_id, tree_id, stock)
            VALUES ($1, $2, $3)
            ON CONFLICT (forest_id, tree_id)
            DO UPDATE SET stock = EXCLUDED.stock
        `;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const {treeId, stock } of treeAssociations) {
                await client.query(insertQuery, [forestId, treeId, stock]);
            }

            const treeIds = treeAssociations.map(ta => ta.treeId);
            if (treeIds.length > 0) {
                const placeholders = treeIds.map((_, i) => `$${i + 2}`).join(', ');
                const deleteQuery = `
                    DELETE FROM forest_tree
                    WHERE forest_id = $1
                    AND tree_id NOT IN (${placeholders})
                `;
                await client.query(deleteQuery, [forestId, ...treeIds]);
            } else {
                await client.query(`DELETE FROM forest_tree WHERE forest_id = $1`, [forestId]);
            }
            await client.query('COMMIT');
        } catch (err: any) {
            await client.query('ROLLBACK');
            console.error("Erreur lors de la mise à jour des associations arbre-forêt :", err.message, err.code, err.detail);
            throw err;
        }
        finally {
            client.release();
        }
    }

    async hasOrders(forestId: number): Promise<boolean> {
        const { rows } = await pool.query(
          'SELECT 1 FROM order_item WHERE forest_id = $1 LIMIT 1',
          [forestId]
        );
        return rows.length > 0;
    }
}