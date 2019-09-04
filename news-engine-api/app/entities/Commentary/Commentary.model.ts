import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { News } from '@app/entities/News/News.model';
import { User } from '@entities/User/User.model';

@Entity()
export class Commentary {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @ManyToOne(() => News, news => news.commentaries)
  public news: News;

  @Column({
    type: 'timestamp',
    default: new Date()
  })
  public createdAt: Date;

  @Column({ nullable: false })
  public text: string;

  @ManyToOne(() => User)
  @JoinColumn()
  public author: User;

  public formatToResponse() {
    const { createdAt, author, text } = this;
    return { createdAt, author: author.formatToResponse(), text };
  }
}
