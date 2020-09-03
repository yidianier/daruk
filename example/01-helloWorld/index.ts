import { controller, DarukContext, DarukServer, get, injectable, Next } from '../../src';

@injectable()
@controller()
class HelloWorld {
  @get('/')
  public async index(ctx: DarukContext, next: Next) {
    ctx.body = 'hello world';
  }
}

(async () => {
  let app = DarukServer();
  let port = 3000;
  await app.binding();
  app.listen(port);
  app.logger.info(`app listen port ${port}`);
})();
