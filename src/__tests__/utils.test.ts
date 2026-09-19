import { describe, it, expect } from 'vitest';
import {
  slugify,
  formatBytes,
  calculateReadingTime,
  resolveBackendUrl,
  cn,
} from '@/lib/utils';

describe('Utility Functions', () => {
  describe('slugify', () => {
    it('converts English title to URL-friendly slug', () => {
      expect(slugify('Breaking News: Tech Summit 2026!')).toBe('breaking-news-tech-summit-2026');
    });

    it('handles multiple consecutive spaces and dashes', () => {
      expect(slugify('Hello   ---  World')).toBe('hello-world');
    });

    it('preserves Bengali unicode text', () => {
      const bengaliText = 'বাংলাদেশ ক্রিকেট দলের ঐতিহাসিক জয়';
      const slug = slugify(bengaliText);
      expect(slug).toContain('বাংলাদেশ');
      expect(slug).toContain('ক্রিকেট');
      expect(slug).not.toContain(' ');
    });

    it('handles trailing and leading dashes', () => {
      expect(slugify('---hello world---')).toBe('hello-world');
    });
  });

  describe('formatBytes', () => {
    it('returns "0 Bytes" for 0 or negative bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(-100)).toBe('0 Bytes');
    });

    it('formats bytes correctly across units', () => {
      expect(formatBytes(500)).toBe('500 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('handles fractional values accurately with default precision', () => {
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(2621440)).toBe('2.5 MB');
    });
  });

  describe('calculateReadingTime', () => {
    it('returns 1 min for empty or short content', () => {
      expect(calculateReadingTime('')).toBe(1);
      expect(calculateReadingTime('Short paragraph here.')).toBe(1);
    });

    it('calculates approximately 200 words per minute', () => {
      const words = Array(600).fill('word').join(' ');
      expect(calculateReadingTime(words)).toBe(3);
    });
  });

  describe('resolveBackendUrl', () => {
    it('returns empty string if given null/undefined/empty', () => {
      expect(resolveBackendUrl(undefined)).toBe('');
      expect(resolveBackendUrl('')).toBe('');
    });

    it('returns untouched url if already absolute with http/https', () => {
      const url = 'https://images.unsplash.com/photo-123';
      expect(resolveBackendUrl(url)).toBe(url);
    });

    it('prepends backend base url for relative asset paths', () => {
      const relPath = '/uploads/articles/banner.jpg';
      const resolved = resolveBackendUrl(relPath);
      expect(resolved).toContain(relPath);
      expect(resolved.startsWith('http://') || resolved.startsWith('https://')).toBe(true);
    });
  });

  describe('cn (Tailwind class merger)', () => {
    it('merges class names and handles conditional classes', () => {
      expect(cn('px-4 py-2', true && 'bg-blue-500', false && 'text-red-500')).toBe('px-4 py-2 bg-blue-500');
    });

    it('resolves conflicting Tailwind utility classes properly', () => {
      expect(cn('p-4', 'p-6')).toBe('p-6');
    });
  });
});
