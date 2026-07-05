import { MigrationInterface, QueryRunner } from 'typeorm';

export class GeolocationAndChallengeProgress1720050000000 implements MigrationInterface {
  name = 'GeolocationAndChallengeProgress1720050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7)
    `);
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_latitude_longitude ON users(latitude, longitude)
    `);

    await queryRunner.query(`
      ALTER TABLE challenges
      ADD COLUMN IF NOT EXISTS progress_value DECIMAL
    `);
    await queryRunner.query(`
      ALTER TABLE challenges
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE challenge_progress
      ADD COLUMN IF NOT EXISTS target_value DECIMAL
    `);
    await queryRunner.query(`
      UPDATE challenge_progress cp
      SET target_value = COALESCE(c.target_value, cp.current_value, 0)
      FROM challenges c
      WHERE cp.challenge_id = c.id
        AND cp.target_value IS NULL
    `);
    await queryRunner.query(`
      UPDATE challenge_progress
      SET target_value = COALESCE(target_value, current_value, 0)
      WHERE target_value IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE challenge_progress
      ALTER COLUMN target_value SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE challenge_progress
      ADD COLUMN IF NOT EXISTS unit VARCHAR
    `);
    await queryRunner.query(`
      ALTER TABLE challenge_progress
      ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE
    `);
    await queryRunner.query(`
      UPDATE challenge_progress
      SET date = CURRENT_DATE
      WHERE date IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE challenge_progress
      ALTER COLUMN date SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE challenge_progress
      ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active'
    `);
    await queryRunner.query(`
      UPDATE challenge_progress
      SET status = COALESCE(status, 'active')
      WHERE status IS NULL
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'challenge_progress'
            AND column_name = 'completed'
        ) THEN
          UPDATE challenge_progress
          SET status = 'completed'
          WHERE completed = true;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE challenge_progress
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP
    `);
    await queryRunner.query(`
      ALTER TABLE challenge_progress
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()
    `);
    await queryRunner.query(`
      ALTER TABLE challenge_progress
      ALTER COLUMN current_value TYPE DECIMAL USING current_value::DECIMAL
    `);
    await queryRunner.query(`
      ALTER TABLE challenge_progress
      DROP CONSTRAINT IF EXISTS challenge_progress_challenge_id_user_id_key
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge_user_date
      ON challenge_progress(challenge_id, user_id, date)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_challenge_progress_challenge_user_date');
    await queryRunner.query('ALTER TABLE challenge_progress ADD CONSTRAINT challenge_progress_challenge_id_user_id_key UNIQUE(challenge_id, user_id)');
    await queryRunner.query('ALTER TABLE challenge_progress ALTER COLUMN current_value TYPE INTEGER USING current_value::INTEGER');
    await queryRunner.query('ALTER TABLE challenge_progress DROP COLUMN IF EXISTS created_at');
    await queryRunner.query('ALTER TABLE challenge_progress DROP COLUMN IF EXISTS completed_at');
    await queryRunner.query('ALTER TABLE challenge_progress DROP COLUMN IF EXISTS status');
    await queryRunner.query('ALTER TABLE challenge_progress DROP COLUMN IF EXISTS date');
    await queryRunner.query('ALTER TABLE challenge_progress DROP COLUMN IF EXISTS unit');
    await queryRunner.query('ALTER TABLE challenge_progress DROP COLUMN IF EXISTS target_value');
    await queryRunner.query('ALTER TABLE challenges DROP COLUMN IF EXISTS completed_at');
    await queryRunner.query('ALTER TABLE challenges DROP COLUMN IF EXISTS progress_value');
    await queryRunner.query('DROP INDEX IF EXISTS idx_users_latitude_longitude');
    await queryRunner.query('ALTER TABLE users DROP COLUMN IF EXISTS longitude');
    await queryRunner.query('ALTER TABLE users DROP COLUMN IF EXISTS latitude');
  }
}
