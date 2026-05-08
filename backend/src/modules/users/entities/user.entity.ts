import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, JoinColumn,
} from 'typeorm';
import { UserPreferences } from './user-preferences.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column()
  name: string;

  @Column({ type: 'date', nullable: true })
  birthdate: Date | null;

  @Column({ name: 'gender_optional', type: 'varchar', nullable: true })
  genderOptional: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'location_region', type: 'varchar', nullable: true })
  locationRegion: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => UserPreferences, (prefs) => prefs.user, { cascade: true })
  preferences: UserPreferences;
}
