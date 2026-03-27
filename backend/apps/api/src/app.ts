import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { questionsRouter } from './routes/questions';
import { reviewsRouter } from './routes/reviews';

const app = new Koa();

app.use(errorHandler);
app.use(requestLogger);
app.use(bodyParser());

app.use(questionsRouter.routes());
app.use(questionsRouter.allowedMethods());
app.use(reviewsRouter.routes());
app.use(reviewsRouter.allowedMethods());

export { app };
