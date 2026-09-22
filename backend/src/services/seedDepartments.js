import { Department, Course } from '../models/index.js';

export async function seedDepartments() {
  try {
    const count = await Department.count();
    if (count > 0) return;

    const defaultData = [
      {
        name: 'Computer Science & Engineering',
        code: 'CSE',
        status: 'Active',
        courses: [
          { name: 'Computer Science', code: 'CS', status: 'Active' },
          { name: 'Data Science', code: 'DS', status: 'Active' },
          { name: 'Artificial Intelligence', code: 'AI', status: 'Active' },
        ],
      },
      {
        name: 'Electronics & Communication Engineering',
        code: 'ECE',
        status: 'Active',
        courses: [
          { name: 'Electronics & Communication', code: 'EC', status: 'Active' },
          { name: 'VLSI Design', code: 'VLSI', status: 'Active' },
        ],
      },
      {
        name: 'Mechanical Engineering',
        code: 'ME',
        status: 'Active',
        courses: [
          { name: 'Mechanical Engineering', code: 'MECH', status: 'Active' },
          { name: 'Robotics & Automation', code: 'ROB', status: 'Active' },
        ],
      },
      {
        name: 'Civil Engineering',
        code: 'CE',
        status: 'Active',
        courses: [
          { name: 'Civil Engineering', code: 'CIVIL', status: 'Active' },
          { name: 'Structural Engineering', code: 'STRUCT', status: 'Active' },
        ],
      },
      {
        name: 'Management Studies',
        code: 'BBA',
        status: 'Active',
        courses: [
          { name: 'Business Administration', code: 'BBA', status: 'Active' },
          { name: 'Financial Management', code: 'FM', status: 'Active' },
        ],
      },
    ];

    for (const deptData of defaultData) {
      const { courses, ...deptFields } = deptData;
      const dept = await Department.create(deptFields);
      if (courses && courses.length > 0) {
        for (const c of courses) {
          await Course.create({ ...c, departmentId: dept.id });
        }
      }
    }

    console.info('Default departments and courses seeded successfully.');
  } catch (err) {
    console.warn('Failed to seed default departments:', err.message);
  }
}
