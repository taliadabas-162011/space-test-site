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
load(first).saveProfile('Jordan Smith', 'female', '25', '');
assert.equal(load(first).getProfile().name, 'Jordan Smith', 'the profile survives a reload');
assert.equal(load(second).hasProfile(), false, 'another browser does not inherit the first profile');
load(second).saveProfile('Alex Morgan', 'male', '30', '');
assert.equal(load(first).getProfile().name, 'Jordan Smith');
assert.equal(load(second).getProfile().name, 'Alex Morgan');
console.log('Profiles are created per browser and persist across reloads.');
