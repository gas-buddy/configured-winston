import fs from 'fs';
import tap from 'tap';
import mockfs from 'mock-fs';
import winston from 'winston';
// Otherwise mock-fs will blow up when winston requires this
import 'winston/lib/winston/transports/file';
import LogConfig from '../src/index';
import * as fake from './fake/fakeTransport';

tap.test('test_config', async (t) => {
  mockfs({
    '/var/log': {},
  });

  try {
    const unused = new LogConfig({}, { transports: { bad: {} } });
    t.notOk(unused, 'should throw');
  } catch (error) {
    t.match(error.message, /invalid transport/i, 'should throw useful error');
  }

  try {
    const unused = new LogConfig({}, { transports: { bad: { name: 'SDLKJ' } } });
    t.notOk(unused, 'should throw');
  } catch (error) {
    t.match(error.message, /not a property on winston.transports/i, 'should throw useful error');
  }

  try {
    const config = {
      transports: {
        fake: {
          start: fake.start,
          name: 'File',
          config: {
            level: 'error',
            filename: '/var/log/foobar',
          },
          stop: fake.stop,
        },
        fakeFake: {
          start: fake.startNoAdd,
          name: 'File',
          config: {
            level: 'error',
            filename: '/var/log/baz',
          },
        },
        disabled: {
          enabled: false,
          module: 'die_in_a_pit_and_reload',
        },
      },
      console: false,
    };

    const configured = new LogConfig({ name: 'test' }, config);
    const logger = await configured.start();
    t.ok(fake.status.started, 'Should have started');
    t.notOk(winston.default.transports.Console);

    const wrapped = logger
      .loggerWithDefaults({ foo: true })
      .loggerWithDefaults(m => Object.assign({ bar: 'baz' }, m));

    wrapped.debug('DEBUG is enabled');
    wrapped.info('INFO is enabled');
    wrapped.warn('WARN is enabled');
    wrapped.error('ERROR is enabled');

    await configured.stop();
    const content = fs.readFileSync('/var/log/foobar', 'utf8');

    t.notMatch(content, /INFO is enabled/, 'should not log info');
    t.notMatch(content, /DEBUG is enabled/, 'should not log debug');
    t.notMatch(content, /WARN is enabled/, 'should not log warn');
    t.match(content, /ERROR is enabled/, 'should log error');
    t.match(content, /"foo":true/, 'Should have wrapped metadata');
    t.match(content, /"bar":"baz"/, 'Should have wrapped metadata with function');

    t.throws(() => fs.accessSync('/var/log/baz'), '/var/log/baz should not exist');

    t.ok(!fake.status.started, 'Should have stopped');
  } finally {
    mockfs.restore();
  }
});
