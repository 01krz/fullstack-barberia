import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as oracledb from 'oracledb';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: oracledb.Pool;

  async onModuleInit() {
    try {
      // Configuración de la conexión Oracle
      const config: oracledb.PoolAttributes = {
        user: 'usuario_bd_personal',
        password: 'corkineta123',
        connectString: 'localhost:1521/XEPDB1',
        poolMin: 2,
        poolMax: 10,
        poolIncrement: 1,
        poolTimeout: 60,
      };

      this.pool = await oracledb.createPool(config);
      console.log('Conexión a Oracle Database establecida correctamente');
    } catch (error) {
      console.error('Error al conectar con Oracle Database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.close();
      console.log('Pool de conexiones cerrado');
    }
  }

  async getConnection(): Promise<oracledb.Connection> {
    return await this.pool.getConnection();
  }

  async executeQuery<T = any>(
    sql: string,
    binds: any = {},
    options: oracledb.ExecuteOptions = {},
  ): Promise<T[]> {
    const connection = await this.getConnection();
    try {
      const result = await connection.execute(sql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        ...options,
      });
      return result.rows as T[];
    } finally {
      await connection.close();
    }
  }

  async executeProcedure(
    procedureName: string,
    binds: any = {},
  ): Promise<any> {
    const connection = await this.getConnection();
    try {
      const result = await connection.execute(
        `BEGIN ${procedureName}(:result); END;`,
        {
          result: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
          ...binds,
        },
      );

      const resultSet = result.outBinds.result;
      const rows: any[] = [];
      let row;
      while ((row = await resultSet.getRow())) {
        rows.push(row);
      }
      await resultSet.close();
      return rows;
    } finally {
      await connection.close();
    }
  }

  async executeInsert(
    sql: string,
    binds: any = {},
  ): Promise<oracledb.Result<any>> {
    const connection = await this.getConnection();
    try {
      const result = await connection.execute(sql, binds, {
        autoCommit: true,
      });
      return result;
    } finally {
      await connection.close();
    }
  }

  async executeInsertWithId(
    sql: string,
    binds: any = {},
    sequenceName: string,
  ): Promise<number> {
    const connection = await this.getConnection();
    try {
      // Obtener el siguiente ID de la secuencia
      const seqQuery = `SELECT ${sequenceName}.NEXTVAL AS id FROM DUAL`;
      const seqResult = await connection.execute(seqQuery, {}, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      const newId = seqResult.rows[0].ID;

      // Agregar el ID a los binds
      const insertBinds = { ...binds, id: newId };
      await connection.execute(sql, insertBinds, {
        autoCommit: true,
      });

      return newId;
    } finally {
      await connection.close();
    }
  }

  async executeUpdate(
    sql: string,
    binds: any = {},
  ): Promise<oracledb.Result<any>> {
    const connection = await this.getConnection();
    try {
      const result = await connection.execute(sql, binds, {
        autoCommit: true,
      });
      return result;
    } finally {
      await connection.close();
    }
  }
}

