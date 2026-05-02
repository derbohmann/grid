export async function saveToDisk(buffer: Buffer, directory: string, filename: string) {
  const fs = await import('fs/promises');
  const path = await import('path');

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, filename), buffer);
}
