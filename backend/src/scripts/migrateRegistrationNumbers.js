import { sequelize } from '../config/database.js';
import { Student, RegistrationSequence } from '../models/index.js';

/**
 * One-time migration script:
 * Migrates existing students whose registration number does not follow
 * the new HS-YY-NNN format to sequential registration numbers.
 *
 * Requirements:
 * - Keeps existing valid HS-YY-NNN numbers (e.g. HS-26-001) unchanged.
 * - Assigns next available sequential numbers without collisions or duplicates.
 * - Updates the RegistrationSequence counter so future students continue from max.
 * - Fully idempotent: running it again does nothing.
 */
export async function migrateRegistrationNumbers() {
  console.log('====================================================');
  console.log('STARTING STUDENT REGISTRATION NUMBER MIGRATION');
  console.log('====================================================\n');

  await sequelize.authenticate();

  const currentYear = String(new Date().getFullYear()).slice(-2);
  const validPattern = /^HS-\d{2}-\d{3,}$/;

  const result = await sequelize.transaction(async (transaction) => {
    // 1. Fetch all existing students ordered by creation date
    const students = await Student.findAll({
      order: [['createdAt', 'ASC'], ['id', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    console.log(`Total students found: ${students.length}`);

    // 2. Identify existing valid registration numbers
    const takenNumbersForYear = new Set();
    const studentsNeedingMigration = [];
    const alreadyValidStudents = [];

    for (const student of students) {
      const reg = String(student.registrationNumber || '').trim();
      if (validPattern.test(reg)) {
        alreadyValidStudents.push(student);
        const parts = reg.split('-');
        if (parts[1] === currentYear) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num)) {
            takenNumbersForYear.add(num);
          }
        }
      } else {
        studentsNeedingMigration.push(student);
      }
    }

    console.log(`- Students already having valid HS-YY-NNN format: ${alreadyValidStudents.length}`);
    for (const s of alreadyValidStudents) {
      console.log(`  • Kept unchanged: ${s.firstName} ${s.lastName} (${s.registrationNumber})`);
    }

    console.log(`- Students needing migration: ${studentsNeedingMigration.length}\n`);

    if (studentsNeedingMigration.length === 0) {
      let maxAssigned = 0;
      for (const num of takenNumbersForYear) {
        if (num > maxAssigned) maxAssigned = num;
      }
      let [seqRecord] = await RegistrationSequence.findOrCreate({
        where: { year: currentYear },
        defaults: { year: currentYear, lastNumber: maxAssigned },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (seqRecord.lastNumber !== maxAssigned) {
        await seqRecord.update({ lastNumber: maxAssigned }, { transaction });
      }
      console.log('No students need migration. Everything is up to date.');
      console.log(`Registration sequence for year '${currentYear}' is synced to last_number = ${maxAssigned}`);
      return { migratedCount: 0, maxAssigned, total: students.length };
    }

    // 3. Assign next available sequential numbers
    let candidateSeq = 1;
    const migrationLog = [];

    for (const student of studentsNeedingMigration) {
      while (takenNumbersForYear.has(candidateSeq)) {
        candidateSeq++;
      }

      const newRegNo = `HS-${currentYear}-${String(candidateSeq).padStart(3, '0')}`;
      takenNumbersForYear.add(candidateSeq);

      const oldRegNo = student.registrationNumber;
      await student.update({ registrationNumber: newRegNo }, { transaction });

      migrationLog.push({
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        oldRegNo,
        newRegNo,
      });

      candidateSeq++;
    }

    // 4. Update the RegistrationSequence counter for this year
    let maxAssigned = 0;
    for (const num of takenNumbersForYear) {
      if (num > maxAssigned) maxAssigned = num;
    }

    let [seqRecord] = await RegistrationSequence.findOrCreate({
      where: { year: currentYear },
      defaults: { year: currentYear, lastNumber: maxAssigned },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (seqRecord.lastNumber !== maxAssigned) {
      await seqRecord.update({ lastNumber: maxAssigned }, { transaction });
    }

    console.log('MIGRATION SUMMARY:');
    console.table(migrationLog);
    console.log(`\nUpdated registration sequence for year '${currentYear}' to last_number = ${Math.max(seqRecord.lastNumber, maxAssigned)}`);

    return {
      migratedCount: migrationLog.length,
      maxAssigned: Math.max(seqRecord.lastNumber, maxAssigned),
      total: students.length,
    };
  });

  console.log('\n====================================================');
  console.log('MIGRATION COMPLETED SUCCESSFULLY');
  console.log('====================================================');
  return result;
}

// Auto-run when executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith('migrateRegistrationNumbers.js')) {
  migrateRegistrationNumbers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\nMIGRATION FAILED:', err);
      process.exit(1);
    });
}
