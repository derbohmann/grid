import { backgroundUploadRoot, iconUploadRoot } from '@/lib/paths';
import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const contentTypes: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; filename: string }> }) {
  const { kind, filename } = await params;
  if (!['icons', 'backgrounds'].includes(kind) || filename.includes('..') || filename.includes('/')) {
    return new NextResponse('Not found', { status: 404 });
  }

  const root = kind === 'icons' ? iconUploadRoot : backgroundUploadRoot;
  const filePath = path.join(root, filename);
  const extension = path.extname(filename).toLowerCase();

  try {
    const file = await readFile(filePath);
    return new NextResponse(file, {
      headers: {
        'content-type': contentTypes[extension] ?? 'application/octet-stream',
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
