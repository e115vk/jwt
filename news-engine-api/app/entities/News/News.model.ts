import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MAX_BODY_LENGTH, MAX_TITLE_LENGTH } from '@entities/News/News.const';
import { Commentary } from '@entities/Commentary/Commentary.model';
import { User } from '@app/entities';

@Entity()
export class News {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ length: MAX_TITLE_LENGTH, nullable: false })
  public title: string;

  @Column({ length: MAX_BODY_LENGTH, nullable: false })
  public body: string;

  @Column({
    type: 'timestamp',
    default: new Date()
  })
  public createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn()
  public author: User;

  @OneToMany(() => Commentary, commentary => commentary.news)
  public commentaries: Commentary[];

  public formatToShortResponse() {
    const { createdAt, title, id } = this;
    return { createdAt: createdAt.toISOString(), title, id };
  }

  public formatToResponse() {
    const { createdAt, author, ...rest } = this;

    return {
      createdAt: createdAt.toISOString(),
      author: author.formatToResponse(),
      ...rest
    };
  }
}
