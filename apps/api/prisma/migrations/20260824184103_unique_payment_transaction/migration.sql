/*
  Warnings:

  - A unique constraint covering the columns `[payment_method_id,transaction_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `payments_method_transaction_unique` ON `payments`(`payment_method_id`, `transaction_id`);
