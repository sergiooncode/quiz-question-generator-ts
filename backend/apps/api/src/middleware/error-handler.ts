import { Context, Next } from 'koa';

export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (err: any) {
    const status = err.status || 500;
    ctx.status = status;
    ctx.body = {
      error: status === 500 ? 'Internal server error' : err.message,
    };
    if (status === 500) {
      console.error(err);
    }
  }
}
