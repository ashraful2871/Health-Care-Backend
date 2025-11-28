/*
  Warnings:

  - A unique constraint covering the columns `[appointmentId]` on the table `doctor_schedule` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "doctor_schedule" ADD COLUMN     "appointmentId" TEXT,
ALTER COLUMN "isBooked" SET DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "doctor_schedule_appointmentId_key" ON "doctor_schedule"("appointmentId");

-- AddForeignKey
ALTER TABLE "doctor_schedule" ADD CONSTRAINT "doctor_schedule_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES " appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
