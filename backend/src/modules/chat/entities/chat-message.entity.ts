import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Match } from '../../matching/entities/match.entity';
import { User } from '../../users/entities/user.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'match_id' })
  matchId: string;

  @Column({ name: 'sender_id' })
  senderId: string;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;
}
