import Router from '@koa/router';
import { listQuestions, getQuestion, generateQuestion } from '../controllers/questions.controller';

const questionsRouter = new Router({ prefix: '/api/questions' });

questionsRouter.get('/', listQuestions);
questionsRouter.get('/:uuid', getQuestion);
questionsRouter.post('/generate', generateQuestion);

export { questionsRouter };
