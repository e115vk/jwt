import { getRepository } from 'typeorm';
import { News, User } from '@app/entities';
import { CommentaryService } from '@entities/Commentary/Commentary.service';

export class NewsService {
  constructor() {}

  public static async getList(limit?: number, offset?: number) {
    const [news, count] = await getRepository(News).findAndCount({ skip: offset || 0, take: limit || 10 });

    const data = news.map(item => item.formatToShortResponse());

    return { data, count };
  }

  public static async getById(id: string) {
    const news = await getRepository(News).findOneOrFail({
      where: { id },
      relations: ['author']
    });
    const commentaries = await CommentaryService.getListByNewsId(id);
    return { ...news.formatToResponse(), commentaries };
  }

  public static async updateById(id: string, updateData: Partial<News>) {
    await getRepository(News).update(id, updateData);
    return NewsService.getById(id);
  }

  public static create(author: User, title: string, body: string) {
    return getRepository(News).save({ author, title, body });
  }
}
