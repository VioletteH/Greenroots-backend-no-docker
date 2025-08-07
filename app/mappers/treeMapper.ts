import { pool } from './db';
import BaseMapper from './baseMapper';
import { snakeToCamel } from '../utils/toggleCase';
import { Tree } from '../types/index';

export default class TreeMapper extends BaseMapper<any> {
    constructor() {
        super('tree');
    }

    // ALL TREES

    async treesWithForests(limit?:number, offset?:number): Promise<any> {
        const query = `
            SELECT 
                t.*,
                json_agg(
                    json_build_object('id', f.id, 'name', f.name,'stock', ft.stock)
                ) AS forests
            FROM tree t
            LEFT JOIN forest_tree ft ON t.id = ft.tree_id
            LEFT JOIN forest f ON ft.forest_id = f.id
            GROUP BY t.id
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `;
        const { rows } = await pool.query(query, [limit, offset]);
        if (!rows || rows.length === 0) {
            return null;
        }
        return snakeToCamel(rows);
    }

    // ONE TREE

    async treeWithForestsAndStock(treeId: number): Promise<any> {
        const query = `
            SELECT tree.*,
                array_remove(array_agg(forest.name ORDER BY forest.name), NULL) AS forestName,
                array_remove(array_agg(forest_tree.stock ORDER BY forest.name), NULL) AS stock
            FROM tree
            LEFT JOIN forest_tree ON tree.id = forest_tree.tree_id
            LEFT JOIN forest ON forest.id = forest_tree.forest_id
            WHERE tree.id = $1
            GROUP BY tree.id;
        `;
        const { rows } = await pool.query(query, [treeId]);
        if (!rows || rows.length === 0) return null;
        return snakeToCamel(rows[0]);
    }

    // FILTERS

    async treesByForest(id : number): Promise<Tree[]> {
        const query = `
            SELECT DISTINCT t.*, ft.stock
            FROM tree t
            JOIN forest_tree ft ON ft.tree_id = t.id
            WHERE ft.forest_id = $1
        `;
        const { rows } = await pool.query(query, [id]);
        if (!rows) return []; 
        return rows.map(snakeToCamel) as Tree[];
    }

    async treesByCountry(slug: string): Promise<Tree[]> {
        const query = `
            SELECT 
            'tree' AS type,
            t.*
            FROM tree t
            JOIN forest_tree ft ON t.id = ft.tree_id
            JOIN forest f ON ft.forest_id = f.id
            WHERE f.country_slug = $1;
        `;
        const { rows } = await pool.query(query, [slug]);
        if (!rows) return []; 
        return rows.map(snakeToCamel) as Tree[];
    }

    async treesByCategory(slug: string): Promise<Tree[]> {
        const query = `
            SELECT *
            FROM tree
            WHERE category_slug = $1
        `;
        const { rows } = await pool.query(query, [slug]);
        if (!rows) return []; 
        return rows.map(snakeToCamel) as Tree[];
    }

    async treesByPrice(limit?:number, offset?:number): Promise<{data: Tree[]; total:number}> {
        const query = `SELECT * FROM tree ORDER BY price LIMIT $1 OFFSET $2`;
        const count = `SELECT COUNT(*) FROM tree`;

        const [dataResult, countResult] = await Promise.all([
            pool.query(query, [limit, offset]),
            pool.query(count),
        ]);

        const data = dataResult.rows.map(snakeToCamel) as Tree[];
        const total = parseInt(countResult.rows[0].count, 10);

        return { data, total };
    }

    // POST, PATCH & DELETE

    // Add tree to forest with stock
    async addTreeToForests(treeId: number, forestAssociations: { forestId: number, stock: number }[]): Promise<void> {
        
        if (!forestAssociations || forestAssociations.length === 0) return; // early exit if no associations

        const query = `
            INSERT INTO forest_tree (tree_id, forest_id, stock)
            VALUES ($1, $2, $3)
        `;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            // For each forest, we insert a row into the forest_tree table
            for (const { forestId, stock } of forestAssociations) {
-                await client.query(query, [treeId, forestId, stock]);
            }
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Update tree associations to forests, adding or updating stock values and removing obsolete associations
    async updateTreeToForests(treeId: number, forestAssociations: { forestId: number, stock: number }[]): Promise<void> {
        
        // we insert a new tree-forest association or update stock if the association already exists
        const insertQuery = `
            INSERT INTO forest_tree (tree_id, forest_id, stock)
            VALUES ($1, $2, $3)
            ON CONFLICT (tree_id, forest_id)
            DO UPDATE SET stock = EXCLUDED.stock
        `;
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
    
            // Insert or update the tree-forest association
            for (const { forestId, stock } of forestAssociations) {
                await client.query(insertQuery, [treeId, forestId, stock]);
            }
    
            // Delete any association that are not in the new list of forestIds
            const forestIds = forestAssociations.map(fa => fa.forestId); // get all forestIds from the associations
            // If there are forestIds, we delete associations that are not in the new list
            if (forestIds.length > 0) {
                // Dynamically generate placeholders for the IN clause in SQL
                const placeholders = forestIds.map((_, i) => `$${i + 2}`).join(', ');
                const deleteQuery = `
                  DELETE FROM forest_tree
                  WHERE tree_id = $1
                  AND forest_id NOT IN (${placeholders})
                `;
                await client.query(deleteQuery, [treeId, ...forestIds]);
            } else {
                // If there are no forestIds, we delete all associations for the tree
                await client.query(`DELETE FROM forest_tree WHERE tree_id = $1`, [treeId]);
            }    
            await client.query('COMMIT');
        } catch (error: any) {
            await client.query('ROLLBACK');
            console.error("Erreur lors de la mise à jour des associations arbre-forêt :", error.message, error.code, error.detail);
            throw error;
        } finally {
            client.release();
        }
    }

    async hasOrders(treeId: number): Promise<boolean> {
        const { rows } = await pool.query(
          'SELECT 1 FROM order_item WHERE tree_id = $1 LIMIT 1',
          [treeId]
        );
        return rows.length > 0;
      }

}