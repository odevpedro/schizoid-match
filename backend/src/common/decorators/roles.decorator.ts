import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../../modules/auth/guards/roles.guard';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
