import { User } from './user';

export interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  url: string;
  caption?: string | null;
  uploader?: User | null;
  createdAt: string;
}
