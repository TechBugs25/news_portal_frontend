import { describe, it, expect } from 'vitest';
import {
  STATUS_CONFIG,
  ROLE_CONFIG,
  NAV_ITEMS,
} from '@/lib/constants';
import { ArticleStatus } from '@/types/article';
import { UserRole } from '@/types/user';

describe('Application Constants & Configurations', () => {
  describe('STATUS_CONFIG', () => {
    it('covers every ArticleStatus value', () => {
      const statuses = Object.values(ArticleStatus);
      for (const status of statuses) {
        const config = STATUS_CONFIG[status];
        expect(config, `Missing status config for: ${status}`).toBeDefined();
        expect(config.label).toBeTruthy();
        expect(config.color).toBeTruthy();
        expect(config.bg).toBeTruthy();
        expect(config.border).toBeTruthy();
      }
    });

    it('has distinctive visual styling for PUBLISHED and ARCHIVED', () => {
      expect(STATUS_CONFIG[ArticleStatus.PUBLISHED].color).toContain('emerald');
      expect(STATUS_CONFIG[ArticleStatus.ARCHIVED].color).toContain('zinc');
    });
  });

  describe('ROLE_CONFIG', () => {
    it('covers all UserRole values', () => {
      const roles = Object.values(UserRole);
      for (const role of roles) {
        const config = ROLE_CONFIG[role];
        expect(config, `Missing role config for: ${role}`).toBeDefined();
        expect(config.label).toBeTruthy();
        expect(config.color).toBeTruthy();
        expect(config.bg).toBeTruthy();
        expect(config.border).toBeTruthy();
      }
    });

    it('distinguishes ADMIN and CHIEF_EDITOR with prominent colors', () => {
      expect(ROLE_CONFIG[UserRole.ADMIN].color).toContain('rose');
      expect(ROLE_CONFIG[UserRole.CHIEF_EDITOR].color).toContain('purple');
    });
  });

  describe('NAV_ITEMS', () => {
    it('contains valid navigation links with labels and valid routes', () => {
      expect(NAV_ITEMS.length).toBeGreaterThan(0);
      for (const item of NAV_ITEMS) {
        expect(item.label).toBeTruthy();
        expect(item.href.startsWith('/')).toBe(true);
        expect(item.roles.length).toBeGreaterThan(0);
      }
    });

    it('ensures /users has admin-only role protection', () => {
      const usersItem = NAV_ITEMS.find((item) => item.href === '/users');
      expect(usersItem).toBeDefined();
      expect(usersItem?.roles).toContain(UserRole.ADMIN);
      expect(usersItem?.roles.length).toBe(1);
    });
  });
});
