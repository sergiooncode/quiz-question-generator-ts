import Router from '@koa/router';
import { reviewQuestion, getReviews } from '../controllers/reviews.controller';

const reviewsRouter = new Router({ prefix: '/api/questions' });

reviewsRouter.post('/:uuid/review', reviewQuestion);
reviewsRouter.get('/:uuid/reviews', getReviews);

export { reviewsRouter };
