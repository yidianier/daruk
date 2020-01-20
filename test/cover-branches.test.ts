/**
 * @fileOverview 覆盖一般测试不能覆盖的分支语句
 */

import chai = require('chai');
import sinon = require('sinon');
import { Daruk, DarukServer } from '../src';

const port = 3000;
const assert = chai.assert;

describe('cover-branches', () => {
  let stubExit: sinon.SinonStub;
  let server: Daruk;

  beforeEach(async () => {
    server = DarukServer();
    stubExit = sinon.stub(process, 'exit');
    // 匿名中间件的情况
    server.initOptions({
      rootPath: __dirname,
      debug: false,
      loggerOptions: {
        disable: true,
        overwriteConsole: false
      }
    });
    await server.initPlugin();
    server.app.use((ctx: any, next: Function) => {
      return next();
    });
    // 传递 host 的情况
    await server.listen(port, '127.0.0.1');
  });

  afterEach((done) => {
    stubExit.restore();
    server.httpServer.close(done);
  });

  it('should call prettyLog with error level when Koa error', () => {
    let prettyLogLevel = '';
    const stubPrettyLog = sinon
      .stub(server, 'prettyLog')
      .callsFake((msg, options = { level: 'info' }) => {
        prettyLogLevel = options.level;
      });

    const err = new Error('mockError');
    // stack 置为空，才能走到 error.stack 不存在的分支
    err.stack = '';
    server.app.emit('error', err);
    // 应该调用 prettyLog 打印错误日志
    assert(prettyLogLevel === 'error');
    stubPrettyLog.restore();
  });

  it('should call default exit hook', (done) => {
    const stubPrettyLog = sinon.stub(server, 'prettyLog');
    const err = new Error('mockError');
    // stack 置为空，才能走到 error.stack 不存在的分支
    err.stack = '';
    // 手动调用报错函数
    // 从而执行进程退出回调
    let uncaughts = process.listeners('uncaughtException');
    let lastUncaught = uncaughts.length - 1;
    uncaughts[lastUncaught](err);

    const delay = 200;
    // 由于时机问题，延迟判断
    setTimeout(() => {
      // 应该调用 prettyLog 3 次
      assert(
        stubPrettyLog.callCount === 3,
        `stubPrettyLog.callCount should 3,now is ${stubPrettyLog.callCount}`
      );
      stubPrettyLog.restore();
      done();
    }, delay);
  });

  // debug 模式下输出高亮日志
  it('should use debugLog in debug mode', () => {
    const stubConsole = sinon.stub(console, 'log');

    server.options.debug = true;
    server.prettyLog('msg');
    // 因为 app.logger 被禁用了
    // 只有 src/utils/debugLog 的调用才会导致 console 的调用
    assert(stubConsole.callCount === 1);
    stubConsole.restore();
  });
});
