import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assessReadings} from '../design/crew-reading-feedback.js';
const result=(key,value,details={})=>assessReadings({[key]:value},details)[0];
test('classifies temperature, heart rate and oxygen boundaries',()=>{
 for(const [field,value,level] of [['temperature',34.9,'red'],['temperature',35,'yellow'],['temperature',36.1,'green'],['temperature',40,'red'],['pulse',39,'red'],['pulse',40,'yellow'],['pulse',60,'green'],['pulse',130,'red'],['oxygen',89,'red'],['oxygen',90,'yellow'],['oxygen',95,'green']]) assert.equal(result(field,value).level,level,`${field} ${value}`);
});
test('classifies pressure and glucose without calling high fasting glucose an emergency',()=>{
 assert.equal(result('pressure',{systolic:119,diastolic:79}).level,'green');
 assert.equal(result('pressure',{systolic:120,diastolic:79}).level,'yellow');
 assert.equal(result('pressure',{systolic:180,diastolic:80}).level,'red');
 assert.equal(result('glucose',53).level,'red');assert.equal(result('glucose',65).level,'yellow');
 assert.equal(result('glucose',80,{glucoseContext:'fasting'}).level,'green');
 assert.equal(result('glucose',126,{glucoseContext:'fasting'}).level,'yellow');
 assert.equal(result('glucose',80).level,'yellow');
});
