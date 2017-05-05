import tap from 'tap';
import LogConfig from '../src/index';

tap.test('test_metadata', async (t) => {
  const configured = new LogConfig({ name: 'test' }, { console: process.env.NODE_ENV !== 'test' });
  const logger = await configured.start();

  const wrapped = logger.loggerWithDefaults({ foo: true });

  const duplicateObject = {
    field: 'field',
  };

  const testMetadata = {
    response: 'response',
    func: () => {},
    duplicateObject,
    deeper: {
      duplicateObject,
      deeper: {
        deeper: {
          deeper: {
            deeper: {
              tooDeep: 'tooDeep',
            },
          },
        },
      },
    },
  };

  const trimmedMetadata = wrapped.applyAdditionalMetadata(testMetadata);
  t.ok(trimmedMetadata.foo, 'Default data should be inserted into metadata.');
  t.strictEquals(trimmedMetadata.func, '[Function]', 'Functions should be replaced.');
  t.strictEquals(typeof trimmedMetadata.duplicateObject, 'object', 'First duplicate should not be replaced.');
  t.strictEquals(trimmedMetadata.deeper.duplicateObject, '[Duplicate]', 'Second duplicate should be replaced.');
  t.strictEquals(trimmedMetadata.deeper.deeper.deeper.deeper.deeper, '[Too Deep]', 'Fields more than 5 levels deep should be removed.');
});
