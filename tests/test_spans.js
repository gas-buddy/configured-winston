import tap from 'tap';
import LogConfig from '../src/index';

tap.test('test_spans', async (t) => {
  const configured = new LogConfig({ name: 'test' }, { console: process.env.NODE_ENV !== 'test' });
  const logger = await configured.start();

  const wrapped = logger.loggerWithDefaults({ foo: true });

  t.ok(!wrapped.spanId, 'Shouldn\'t have a span id initially');

  const logger1 = wrapped.loggerWithNewSpan('first new span from top');
  t.strictEquals(logger1.spanId, '1', 'Should have a span id of 1');

  const logger2 = logger1.loggerWithNewSpan('new span from child');
  t.strictEquals(logger2.spanId, '1.1', 'Should have a span id of 1.1');

  const logger3 = wrapped.loggerWithNewSpan('second new span from top');
  t.strictEquals(logger3.spanId, '2', 'Should have a span id of 2');

  const l4 = logger3.loggerWithNewSpan('new span from second child');
  t.strictEquals(l4.spanId, '2.1', 'Should have a span id of 2.1');
});
