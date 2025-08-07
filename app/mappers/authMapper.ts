import { pool } from './db';

import BaseMapper from './baseMapper';

import { User } from '../types';

export default class AuthMapper extends BaseMapper<User> {
  constructor() {
    super('user');
  }

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await pool.query(
      `SELECT * FROM "${this.tableName}" WHERE email = $1 LIMIT 1`, [email]
    );
    if (rows.length === 0) return null;
    return rows[0] as User;
  }
}
