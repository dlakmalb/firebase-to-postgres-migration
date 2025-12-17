import "dotenv/config";

import { prisma } from "./prisma";
import { migrateCustomers } from "./migrate/customers";
import { migrateUsers } from './migrate/users';
import { migrateVehicles } from './migrate/vehicles';
import { migrateProducts } from './migrate/products';
import { migrateExpenses } from './migrate/expenses';
import { migrateSales } from './migrate/sales';
import { migrateReturns } from './migrate/returns';
import { migrateStockTransactions } from './migrate/stockTransactions';

async function main() {
  await migrateCustomers();
  await migrateUsers();
  await migrateVehicles();
  await migrateProducts();
  await migrateExpenses();
  await migrateSales();
  await migrateReturns();
  await migrateStockTransactions();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Migration finished");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
