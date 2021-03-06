/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint prefer-arrow-callback: "off" */
import chai from 'chai';
import {
  ERROR_NO_ALTERNATIVE,
  ERROR_NOT_STRING,
  ERROR_NOT_NUMBER,
} from '../constants.js';
import pluginOneOf from './oneOf.js';

const should = chai.should();

describe('Test oneOf plugin', function () {
  beforeEach(function () {
    const compiler = {
      Schema: class Schema {},
      options: {},
      compile: (schemaDef) => {
        if (schemaDef === String) {
          return {
            typeName: 'string',
            validate: value => (typeof value === 'string' ? undefined : { error: ERROR_NOT_STRING, actual: value }),
          };
        } else if (schemaDef === Number) {
          return {
            typeName: 'number',
            validate: value => (typeof value === 'number' ? undefined : { error: ERROR_NOT_NUMBER, actual: value }),
          };
        }
        return { validate: () => ({}) };
      },
    };
    pluginOneOf.mixin(compiler.Schema);
    this.createValidate =
      (schemaDef, schemaOptions = {}) =>
      pluginOneOf.compile(compiler, new compiler.Schema.OneOf(schemaDef), schemaOptions).validate;
  });

  describe('Given a "oneOf" schema', function () {
    beforeEach(function () {
      this.validate1 = this.createValidate([Number, String]);
    });
    it('should accept a number', function () {
      should.not.exist(this.validate1(1));
    });
    it('should accept a string', function () {
      should.not.exist(this.validate1('a'));
    });
    it('should reject if neither string nor number', function () {
      this.validate1(true).should.deep.equal({
        error: ERROR_NO_ALTERNATIVE,
        expected: ['number', 'string'],
      });
    });
  });
});
