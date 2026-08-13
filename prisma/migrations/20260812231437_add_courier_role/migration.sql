-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'COURIER';

-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN "courierId" TEXT;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
