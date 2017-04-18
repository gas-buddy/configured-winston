import tap from 'tap';
import LogConfig from '../src/index';

tap.test('test_spans', async (t) => {
  const configured = new LogConfig({ name: 'test' }, { console: false });
  const logger = await configured.start();

  const wrapped = logger
    .loggerWithDefaults({ foo: true });

  t.ok(!wrapped.spanId, 'Shouldn\'t have a span id initially');
  wrapped.pushSpan();
  t.strictEquals(wrapped.spanId, '1', 'Should have a span id of 1');
  wrapped.pushSpan();
  t.strictEquals(wrapped.spanId, '1.1', 'Should have a span id of 1.1');
  wrapped.popSpan();
  t.strictEquals(wrapped.spanId, '1', 'Should have a span id of 1 after pop');
  wrapped.pushSpan();
  t.strictEquals(wrapped.spanId, '1.2', 'Should have a span id of 1.2 after push');

  const otherService = logger.loggerWithDefaults({});
  otherService.importSpan(wrapped.spanId);
  t.strictEquals(otherService.spanId, '1.2', 'should import span');
  otherService.pushSpan();
  t.strictEquals(otherService.spanId, '1.2.1', 'should import span');
  otherService.popSpan();
  t.strictEquals(otherService.spanId, '1.2', 'should pop span');
  otherService.pushSpan();
  t.strictEquals(otherService.spanId, '1.2.2', 'should push span');
  otherService.popSpan();
  t.strictEquals(otherService.spanId, '1.2', 'should pop span');
  otherService.popSpan();
  t.strictEquals(otherService.spanId, '1.2', 'should not pop beyond our span');
});
