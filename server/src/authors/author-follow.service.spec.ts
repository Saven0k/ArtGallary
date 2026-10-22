import { Op } from 'sequelize';
import { AuthorFollowService } from './author-follow.service';
import { AuthorProfile } from './author.model';
import { User } from '../users/users.model';

function fixture(rows: unknown[] = []) {
  const followModel = {
    findAndCountAll: jest.fn().mockResolvedValue({ count: rows.length, rows }),
    count: jest.fn().mockResolvedValue([{ author_id: 8, count: '12' }]),
    destroy: jest.fn().mockResolvedValue(1),
    create: jest.fn(),
  };
  const userModel = { findByPk: jest.fn().mockResolvedValue({ id: 3 }) };
  const notificationService = { createNotification: jest.fn() };
  const service = new AuthorFollowService(
    followModel as never,
    {} as never,
    userModel as never,
    { log: jest.fn() } as never,
    notificationService as never,
  );
  return { service, followModel, userModel, notificationService };
}

describe('profile following', () => {
  it('returns only own active authors with real metadata and one grouped follower count query', async () => {
    const { service, followModel } = fixture([
      {
        author_id: 8,
        created_at: new Date(),
        author: {
          user: { name: 'Anna', surname: 'Ivanova' },
          profession: { id: 2, name: 'Painter' },
          avatar_path: '/anna.png',
          biography: 'Landscape artist',
        },
      },
      {
        author_id: 9,
        created_at: new Date(),
        author: { user: { name: 'Lee', surname: '' } },
      },
    ]);
    const result = await service.getUserFollowing(3, 2, 20);
    expect(followModel.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: 3 },
        offset: 20,
        limit: 20,
        include: [
          expect.objectContaining({
            model: AuthorProfile,
            required: true,
            where: { is_deleted: false },
            include: expect.arrayContaining([
              expect.objectContaining({
                model: User,
                required: true,
                where: { is_deleted: false },
              }),
            ]) as unknown,
          }),
        ],
      }),
    );
    expect(followModel.count).toHaveBeenCalledTimes(1);
    expect(followModel.count).toHaveBeenCalledWith({
      where: { author_id: { [Op.in]: [8, 9] } },
      group: ['author_id'],
    });
    expect(result.data).toEqual([
      expect.objectContaining({
        author_id: 8,
        profession: { id: 2, name: 'Painter' },
        followers_count: 12,
        description: 'Landscape artist',
      }),
      expect.objectContaining({
        author_id: 9,
        profession: null,
        followers_count: 0,
        description: null,
      }),
    ]);
  });

  it('does not query follower counts for an empty page', async () => {
    const { service, followModel } = fixture();
    expect((await service.getUserFollowing(3)).data).toEqual([]);
    expect(followModel.count).not.toHaveBeenCalled();
  });

  it.each([
    [0, 20],
    [1.5, 20],
    [1, 101],
    [1, 0],
    [1, NaN],
  ])(
    'rejects invalid pagination %s, %s before accessing data',
    async (page, limit) => {
      const { service, userModel } = fixture();
      await expect(
        service.getUserFollowing(3, page, limit),
      ).rejects.toMatchObject({ status: 400 });
      expect(userModel.findByPk).not.toHaveBeenCalled();
    },
  );

  it('unsubscribes idempotently and cannot create a subscription or notification', async () => {
    const { service, followModel, notificationService } = fixture();
    followModel.destroy.mockResolvedValueOnce(1).mockResolvedValueOnce(0);
    followModel.count.mockResolvedValue(12);
    for (let attempt = 0; attempt < 2; attempt++)
      expect(await service.unfollow(3, 8)).toEqual({
        success: true,
        is_following: false,
        followers_count: 12,
      });
    expect(followModel.destroy).toHaveBeenNthCalledWith(1, {
      where: { user_id: 3, author_id: 8 },
    });
    expect(followModel.destroy).toHaveBeenNthCalledWith(2, {
      where: { user_id: 3, author_id: 8 },
    });
    expect(followModel.create).not.toHaveBeenCalled();
    expect(notificationService.createNotification).not.toHaveBeenCalled();
  });
});
