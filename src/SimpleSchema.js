import createSchema from './createSchema.js';
import presetDefault from './plugins/presetDefault.js';

const SimpleSchema = createSchema({
  plugins: [
    ...presetDefault,
  ],
  decimal: false,
  additionalProperties: false,
  fieldsOptionalByDefault: false,
  emptyStringsAreMissingValues: true,
});

export default SimpleSchema;
