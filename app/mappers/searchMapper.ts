import { pool } from './db';

export const searchMapper = async (search: string): Promise<any[]> => {
    const query = `
        SELECT 
            'tree' AS type,
            t.id,
            t.name,
            t.scientific_name,
            t.image,
            t.category,
            t.category_slug,
            t.description,
            t.co2,
            t.o2,
            t.price,
            t.created_at,
            t.updated_at,
            NULL AS association,
            NULL AS country,
            NULL AS country_slug,
            NULL AS location_x,
            NULL AS location_y
        FROM tree t
        WHERE remove_accents(t.name) ILIKE remove_accents($1)
        UNION ALL
        SELECT 
            'forest' AS type,
            f.id,
            f.name,
            NULL AS scientific_name,
            f.image,
            NULL AS category,
            NULL AS category_slug,
            f.description,
            NULL AS co2,
            NULL AS o2,
            NULL AS price,
            f.created_at,
            f.updated_at,
            f.association,
            f.country,
            f.country_slug,
            f.location_x,
            f.location_y
        FROM forest f
        WHERE remove_accents(f.name) ILIKE remove_accents($1)
    `;
    const {rows} = await pool.query(query, [`%${search}%`]);
    if (!rows) {
        return [];
    }
    return rows;
};