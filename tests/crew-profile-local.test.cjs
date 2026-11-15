const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = name => fs.readFileSync(path.join(__dirname, '..', 'design', name), 'utf8');
function load(data) {
 const localStorage = {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value))};
 const window = {location:{search:''},addEventListener(){},dispatchEvent(){}};
 const document = {documentElement:{hasAttribute(){return true}},addEventListener(){},querySelectorAll(){return []}};
 const ctx = vm.createContext({window,document,localStorage,URLSearchParams,console,structuredClone,CustomEvent:class {}});
 vm.runInContext(source('crew-demo.js'),ctx); vm.runInContext(source('crew-health.js'),ctx); return window.CrewDesign;
}
const first = new Map(), second = new Map();
assert.equal(load(first).hasProfile(), false, 'a new browser starts without a profile');
load(first).saveProfile('Jordan Smith', 'female', '25', '60');
assert.equal(load(first).getProfile().name, 'Jordan Smith', 'the profile survives a reload');
assert.equal(load(second).hasProfile(), false, 'another browser does not inherit the first profile');
load(second).saveProfile('Alex Morgan', 'male', '30', '75');
assert.equal(load(first).getProfile().name, 'Jordan Smith');
assert.equal(load(second).getProfile().name, 'Alex Morgan');
console.log('Profiles are created per browser and persist across reloads.');

const oldDemo = new Map([['crew-health-demo-profile-v1', JSON.stringify({name:'Talia',model:'female',age:'',bodyMass:''})]]);
assert.equal(load(oldDemo).hasProfile(), false, 'the old automatic demo profile prompts for setup');
assert.equal(JSON.parse(oldDemo.get('crew-health-demo-profile-v1')).name, 'Talia', 'opening setup does not delete the old profile');
load(oldDemo).saveProfile('Rana Samir', 'female', '21', '56');
assert.equal(load(oldDemo).getProfile().name, 'Rana Samir');
const savedTalia = new Map([['crew-health-demo-profile-v1', JSON.stringify({name:'Talia',model:'female',age:'',bodyMass:'',createdAt:'2026-11-15T12:00:00Z'})]]);
assert.equal(load(savedTalia).getProfile().name,'Talia', 'a genuinely saved profile is preserved');

assert.throws(() => load(new Map()).saveProfile('Test Name', 'female', '', '60'), /valid age/);
assert.throws(() => load(new Map()).saveProfile('Test Name', 'female', '25', ''), /valid body mass/);
