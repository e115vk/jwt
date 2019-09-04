import * as express from 'express';
import { NewsService } from '@entities/News/News.service';

const NewsController = express.Router();

NewsController.route('/news').get(async (req, res, next) => {
  try {
    const { limit, offset } = req.query;
    return res.json(await NewsService.getList(limit, offset));
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

NewsController.route('./news').post(async (req, res, next) => {
  try {
    const { title, body } = req.body;
    const user = (req as any).user;
    return await NewsService.create(user, title, body);
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

NewsController.route('/news/:id').get(async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await NewsService.getById(id);
    return res.json(result);
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

NewsController.route('/news/:id').put(async (req, res, next) => {
  try {
    const {
      params: { id },
      body
    } = req;

    const result = await NewsService.updateById(id, body);

    return res.json(result);
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

export { NewsController };
