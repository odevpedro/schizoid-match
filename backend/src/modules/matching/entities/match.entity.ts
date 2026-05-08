import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, Check, Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('matches')
@Unique(['userId1', 'userId2'])
@Check(`"user_id_1" != "user_id_2"`)
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id_1' })
  userId1: string;

  @Column({ name: 'user_id_2' })
  userId2: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id_1' })
  user1: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id_2' })
  user2: User;

  @Column({ name: 'score_compatibility', type: 'decimal', precision: 5, scale: 2, nullable: true })
  scoreCompatibility: number;

  @Column({ default: 'active' })
  status: 'active' | 'unmatched' | 'blocked';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
