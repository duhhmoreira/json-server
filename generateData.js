var faker = require('faker');

var database = { sales: [], users: [] };

for (var i=1; i<=50; i++) {
  const totalValue = faker.finance.amount(0, 1000, 2)
  const totalPercentCashback = faker.finance.amount(0, 100, 1)
  database.sales.push({
    id: i,
    date: faker.date.past().toISOString().split("T")[0],
    totalValue,
    totalValueCashback: ((totalValue / 100) * totalPercentCashback).toFixed(2),
    totalPercentCashback,
    status: faker.datatype.boolean() ? 'approved' : 'reproved',
    sellerId: 1
  });
}

database.users.push(
  {
    "id": 1,
    "name": "eduardo",
    "email": "eduardo@email.com",
    "password": "eduardo",
    "cpf": "12312312312"
  }
)

console.log(JSON.stringify(database));