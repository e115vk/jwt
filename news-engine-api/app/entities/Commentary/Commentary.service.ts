import { getRepository } from 'typeorm';
import { Commentary } from '@app/entities';

export class CommentaryService {
  public static async getListByNewsId(id: string, limit = 10, offset = 0) {
    const commentaries = await getRepository(Commentary).find({
      where: { news: { id } },
      relations: ['author'],
      take: limit,
      skip: offset
    });

    return commentaries.map(item => item.formatToResponse());
  }
}
