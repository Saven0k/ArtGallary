import { ProfessionsModule } from './professions.module';
import { ProfessionsService } from './professions.service';
import { Profession, type ProfessionCreationAttrs } from './profession.model';

type SeedProfession = ProfessionCreationAttrs & { id: number };

function fixture(initial: SeedProfession[] = []) {
  const records = new Map(initial.map((record) => [record.name, record]));
  const repository = {
    findOrCreate: jest.fn(
      ({
        where,
        defaults,
      }: {
        where: { name: string };
        defaults: ProfessionCreationAttrs;
      }): Promise<[SeedProfession, boolean]> => {
        const existing = records.get(where.name);
        if (existing) return Promise.resolve([existing, false]);
        const record = { id: records.size + 100, ...defaults };
        records.set(record.name, record);
        return Promise.resolve([record, true]);
      },
    ),
  };
  const service = new ProfessionsService(
    repository as unknown as typeof Profession,
  );
  return {
    records,
    repository,
    service,
    module: new ProfessionsModule(service),
  };
}

test('server initialization fills the empty professions table with nine named descriptions', async () => {
  const f = fixture();
  await f.module.onModuleInit();
  expect([...f.records.keys()].sort()).toEqual(
    [
      'Художник',
      'Скульптор',
      'Фотограф',
      'Графический дизайнер',
      'Иллюстратор',
      'Архитектор',
      'Керамист',
      'Реставратор',
      'Художник по костюмам',
    ].sort(),
  );
  for (const record of f.records.values())
    expect(record.description.trim()).not.toBe('');
  await expect(f.service.seedProfessions()).resolves.toMatchObject({
    success: true,
    created: 0,
  });
  expect(f.records.size).toBe(9);
});

test('startup adds missing defaults without replacing existing professions or custom records', async () => {
  const artist = {
    id: 7,
    name: 'Художник',
    description: 'Описание администратора',
  };
  const custom = {
    id: 19,
    name: 'Ювелир',
    description: 'Пользовательская профессия',
  };
  const f = fixture([artist, custom]);
  await f.module.onModuleInit();
  expect(f.records.size).toBe(10);
  expect(f.records.get(artist.name)).toBe(artist);
  expect(f.records.get(custom.name)).toBe(custom);
  await f.module.onModuleInit();
  expect(f.records.size).toBe(10);
});

test('a failed database insert rejects startup and can be retried on the next launch', async () => {
  const f = fixture();
  const failure = new Error('Database unavailable');
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    f.repository.findOrCreate.mockRejectedValueOnce(failure);
    await expect(f.module.onModuleInit()).rejects.toBe(failure);
    expect(log).toHaveBeenCalled();
    expect(f.records.size).toBe(0);
    await f.module.onModuleInit();
    expect(f.records.size).toBe(9);
  } finally {
    log.mockRestore();
  }
});
