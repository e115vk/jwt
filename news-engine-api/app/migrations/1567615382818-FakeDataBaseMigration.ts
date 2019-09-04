import { DeepPartial, getRepository, MigrationInterface } from 'typeorm';
import * as faker from 'faker';

import { Commentary, News, User } from '@app/entities';

export class FakeDataBaseMigration1567618325473 implements MigrationInterface {
  public async up(): Promise<void> {
    for (let i = 0; i < 20; i++) {
      const fakeUser = await getRepository(User).save(createFakeUser());
      const fakeNews = await getRepository(News).save(createFakeNews(fakeUser));
      await getRepository(Commentary).save(createFakeCommentary(fakeUser, fakeNews));
    }
  }

  public async down(): Promise<void> {
    await getRepository(Commentary).delete({});
    await getRepository(News).delete({});
    await getRepository(User).delete({});
  }
}

function createFakeUser(): DeepPartial<User> {
  const [randomName, randomEmail, randomPassword] = [
    faker.internet.userName(),
    faker.internet.email(),
    faker.internet.password()
  ];

  return { name: randomName, email: randomEmail, password: randomPassword };
}

function createFakeNews(author: User): DeepPartial<News> {
  const randomWord = faker.lorem.word();
  const randomText = faker.lorem.text();

  return { title: randomWord, body: randomText, author };
}

function createFakeCommentary(author: User, news: News) {
  return Array(20)
    .fill('')
    .map(() => {
      return { author, news, text: faker.lorem.sentence() };
    });
}
