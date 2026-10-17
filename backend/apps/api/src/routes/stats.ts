import Router from '@koa/router';
import { getStats } from '../controllers/stats.controller';

const statsRouter = new Router({ prefix: '/api/stats' });

statsRouter.get('/', getStats);

export { statsRouter };
