const mongoose = require('mongoose');

const TEST_PASSWORD = 'Abcd@123';

const ADMIN = {
  firstName: 'Demo',
  lastName: 'Admin',
  email: 'admin.demo@sevasetu.example',
  phone: '9999999999',
};

const AGENTS = [
  { firstName: 'Ravi', lastName: 'Kumar', email: 'agent1.demo@sevasetu.example', phone: '8888888881', designation: 'Senior Agent', serviceSpecialization: 'Certificates' },
  { firstName: 'Sneha', lastName: 'Patil', email: 'agent2.demo@sevasetu.example', phone: '8888888882', designation: 'Verification Officer', serviceSpecialization: 'Licenses' },
  { firstName: 'Amit', lastName: 'Singh', email: 'agent3.demo@sevasetu.example', phone: '8888888883', designation: 'Field Agent', serviceSpecialization: 'Inspections' },
  { firstName: 'Pooja', lastName: 'Sharma', email: 'agent4.demo@sevasetu.example', phone: '8888888884', designation: 'Junior Agent', serviceSpecialization: 'General' },
  { firstName: 'Karan', lastName: 'Mehta', email: 'agent5.demo@sevasetu.example', phone: '8888888885', designation: 'Trainee', serviceSpecialization: 'Support' }
];

const CITIZENS = [
  { firstName: 'Aarav', lastName: 'Sharma', email: 'aarav.demo@sevasetu.example', phone: '7777777771', address: '12 MG Road', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001' },
  { firstName: 'Meera', lastName: 'Verma', email: 'meera.demo@sevasetu.example', phone: '7777777772', address: '34 Brigade Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001' },
  { firstName: 'Rohan', lastName: 'Das', email: 'rohan.demo@sevasetu.example', phone: '7777777773', address: '56 Park Street', city: 'Kolkata', state: 'West Bengal', postalCode: '700016' },
  { firstName: 'Kavya', lastName: 'Nair', email: 'kavya.demo@sevasetu.example', phone: '7777777774', address: '78 Marine Drive', city: 'Kochi', state: 'Kerala', postalCode: '682031' },
  { firstName: 'Arjun', lastName: 'Mehta', email: 'arjun.demo@sevasetu.example', phone: '7777777775', address: '90 CG Road', city: 'Ahmedabad', state: 'Gujarat', postalCode: '380009' },
  { firstName: 'Ishita', lastName: 'Roy', email: 'ishita.demo@sevasetu.example', phone: '7777777776', address: '12 Janpath', city: 'New Delhi', state: 'Delhi', postalCode: '110001' },
  { firstName: 'Vivek', lastName: 'Kumar', email: 'vivek.demo@sevasetu.example', phone: '7777777777', address: '34 FC Road', city: 'Pune', state: 'Maharashtra', postalCode: '411004' },
  { firstName: 'Nisha', lastName: 'Joshi', email: 'nisha.demo@sevasetu.example', phone: '7777777778', address: '56 MI Road', city: 'Jaipur', state: 'Rajasthan', postalCode: '302001' },
  { firstName: 'Aditya', lastName: 'Rao', email: 'aditya.demo@sevasetu.example', phone: '7777777779', address: '78 Banjara Hills', city: 'Hyderabad', state: 'Telangana', postalCode: '500034' },
  { firstName: 'Priya', lastName: 'Kapoor', email: 'priya.demo@sevasetu.example', phone: '7777777770', address: '90 Sector 17', city: 'Chandigarh', state: 'Chandigarh', postalCode: '160017' }
];

module.exports = {
  TEST_PASSWORD,
  ADMIN,
  AGENTS,
  CITIZENS
};
