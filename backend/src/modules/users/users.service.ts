import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { UserPreferences } from './entities/user-preferences.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserPreferences)
    private readonly preferencesRepo: Repository<UserPreferences>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(dto.password, rounds);

    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      birthdate: dto.birthdate ? new Date(dto.birthdate) : undefined,
      genderOptional: dto.genderOptional,
      locationRegion: dto.locationRegion,
    });

    const savedUser = await this.usersRepo.save(user);

    const prefs = this.preferencesRepo.create({ userId: savedUser.id });
    await this.preferencesRepo.save(prefs);

    return savedUser;
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['preferences'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .andWhere('user.isDeleted = false')
      .getOne();
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto): Promise<UserPreferences> {
    const prefs = await this.preferencesRepo.findOne({ where: { userId } });
    if (!prefs) throw new NotFoundException('Preferences not found');

    Object.assign(prefs, dto);
    return this.preferencesRepo.save(prefs);
  }

  async getPublicProfile(userId: string) {
    const user = await this.findById(userId);
    const { passwordHash, isDeleted, deletedAt, ...publicData } = user as any;
    return publicData;
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<void> {
    await this.usersRepo.update({ id: userId }, { avatarUrl });
  }

  async softDelete(userId: string): Promise<void> {
    await this.usersRepo.update(
      { id: userId },
      {
        isDeleted: true,
        deletedAt: new Date(),
        email: `deleted_${userId}@wellmatch.invalid`,
        name: 'Deleted User',
        bio: null,
        locationRegion: null,
        avatarUrl: null,
      },
    );
  }
}
