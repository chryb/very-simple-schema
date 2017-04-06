/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint prefer-arrow-callback: "off" */
import chai from 'chai';
import {
  ERROR_MISSING_FIELD,
  ERROR_VALUE_NOT_ALLOWED,
  ERROR_DOES_NOT_MATCH,
  ERROR_NOT_NUMBER,
  ERROR_NOT_STRING,
  ERROR_KEY_NOT_ALLOWED,
} from './constants.js';
import Schema from './Schema.js';

const should = chai.should();

describe('Test Schema', function () {
  describe('Given "any" schema', function () {
    beforeEach(function () {
      this.schema = new Schema(Schema.Any);
    });
    it('should set "any" flag', function () {
      this.schema.compiled.isAny.should.be.true;
    });
    it('should accept an empty object', function () {
      should.not.exist(this.schema.getErrors({}));
    });
    it('should accept a number', function () {
      should.not.exist(this.schema.getErrors(1));
    });
  });

  describe('Given empty schema', function () {
    beforeEach(function () {
      this.schema = new Schema({});
    });
    it('should validate empty object', function () {
      should.not.exist(this.schema.getErrors({}));
    });
  });

  describe('Given a schema with allowedValues', function () {
    describe('and the schema is an array', function () {
      beforeEach(function () {
        this.schema1 = new Schema([String], { allowedValues: ['a', 'b', 'c'] });
      });
      it('should reject value that is not allowed', function () {
        this.schema1.getErrors(['a', 'b', 'x']).should.deep.equal({
          errors: [
            undefined,
            undefined,
            {
              error: ERROR_VALUE_NOT_ALLOWED,
              actual: 'x',
              expected: ['a', 'b', 'c'],
            },
          ],
        });
      });
      it('should accept value that is allowed', function () {
        should.not.exist(this.schema1.getErrors(['a', 'b', 'c']));
      });
    });
  });

  describe('Given a schema with regular expression', function () {
    describe('and the schema is an array', function () {
      beforeEach(function () {
        this.schema1 = new Schema([String], { regEx: /\d+/ });
      });
      it('should reject value that is not allowed', function () {
        this.schema1.getErrors(['1', '12', 'xxx']).should.deep.equal({
          errors: [
            undefined,
            undefined,
            {
              error: ERROR_DOES_NOT_MATCH,
              expected: 'match /\\d+/',
            },
          ],
        });
      });
      it('should accept value that is allowed', function () {
        should.not.exist(this.schema1.getErrors(['1', '12', '123']));
      });
    });
  });

  describe('Given a nested object schema', function () {
    beforeEach(function () {
      this.schema1 = new Schema({
        a: {
          x: Number,
          y: Number,
        },
        b: {
          type: new Schema({
            x: Number,
            y: Number,
          }),
        },
        c: {
          type: {
            x: Number,
            y: Number,
          },
        },
      });
    });
    it('should reject object with missing properties', function () {
      this.schema1.getErrors({
        a: { x: 1 },
        b: { x: 1 },
        c: { x: 1 },
      }).should.deep.equal({
        errors: {
          a: { errors: { y: { error: ERROR_MISSING_FIELD } } },
          b: { errors: { y: { error: ERROR_MISSING_FIELD } } },
          c: { errors: { y: { error: ERROR_MISSING_FIELD } } },
        },
      });
    });
  });

  describe('Given a schema with lazy fields', function () {
    beforeEach(function () {
      this.schema1 = new Schema({
        children: {
          type: [() => this.schema1],
          lazy: true,
        },
      });
    });

    it('should accept a nested object', function () {
      should.not.exist(this.schema1.getErrors({
        children: [{
          children: [{
            children: [],
          }],
        }],
      }));
    });

    it('should reject object with missing fields', function () {
      this.schema1.getErrors({}).should.deep.equal({
        errors: {
          children: { error: ERROR_MISSING_FIELD },
        },
      });
    });
  });

  describe('Given a merge schema', function () {
    beforeEach(function () {
      this.schema1 = new Schema([
        {
          a: { type: Number },
          b: { type: String },
        },
        {
          b: { type: Number },
          c: { type: String },
        },
      ], { merge: true });
    });

    it('should accept a valid object', function () {
      should.not.exist(this.schema1.getErrors({
        a: 1,
        b: 1,
        c: 'x',
      }));
    });

    it('should reject an object with invalid property type', function () {
      this.schema1.getErrors({
        a: 1,
        b: 'x',
        c: 'x',
      }).should.deep.equal({
        errors: {
          b: { error: ERROR_NOT_NUMBER, actual: 'x' },
        },
      });
    });
  });

  describe('Given a schema with "pick"', function () {
    beforeEach(function () {
      this.schema1 = new Schema({
        a: { type: Number },
        b: { type: String },
        c: { type: Number },
      }, { pick: ['a', 'b'] });
    });

    it('should accept a valid object', function () {
      should.not.exist(this.schema1.getErrors({
        a: 1,
        b: 'x',
      }));
    });

    it('should reject an object with invalid property type', function () {
      this.schema1.getErrors({
        a: 1,
        b: 1,
        c: 'x',
      }).should.deep.equal({
        errors: {
          b: { error: ERROR_NOT_STRING, actual: 1 },
          c: { error: ERROR_KEY_NOT_ALLOWED },
        },
      });
    });
  });

  describe('Given a merged schema', function () {
    beforeEach(function () {
      this.schema1 = Schema.merge([
        {
          a: { type: String },
          b: { type: String },
        },
        {
          b: { type: String, optional: true },
          c: { type: String },
          d: { type: String },
        },
      ]);
    });

    it('should accept a valid object', function () {
      should.not.exist(this.schema1.getErrors({
        a: 'a',
        c: 'c',
        d: 'd',
      }));
    });

    it('should reject an invalid object', function () {
      this.schema1.getErrors({
        c: 'c',
        d: 'd',
      }).should.deep.equal({
        errors: {
          a: { error: ERROR_MISSING_FIELD },
        },
      });
    });

    it('should flag itself with isObject', function () {
      this.schema1.compiled.isObject.should.be.true;
    });

    it('should provide getSubSchema function', function () {
      this.schema1.compiled.getSubSchema.should.be.ok;
    });
  });
});
