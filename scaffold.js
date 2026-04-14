const fs = require('fs');
const path = require('path');

const folders = [
  'app/(auth)/login',
  'app/(auth)/register',
  'app/(auth)/role-select',
  'app/(auth)/onboarding/student',
  'app/(auth)/onboarding/tutor',
  'app/(dashboard)/student/dashboard',
  'app/(dashboard)/student/modules',
  'app/(dashboard)/student/modules/[id]',
  'app/(dashboard)/student/notes/[id]',
  'app/(dashboard)/student/quiz/[id]',
  'app/(dashboard)/student/exams/[id]',
  'app/(dashboard)/student/groups',
  'app/(dashboard)/student/planner',
  'app/(dashboard)/student/analytics',
  'app/(dashboard)/student/settings',
  'app/(dashboard)/tutor/dashboard',
  'app/(dashboard)/tutor/groups',
  'app/(dashboard)/tutor/groups/[id]',
  'app/(dashboard)/tutor/materials',
  'app/(dashboard)/tutor/settings',
  'components/ui',
  'components/student',
  'components/tutor',
  'components/shared',
  'hooks',
  'contexts'
];

folders.forEach(folder => {
  const fullPath = path.join(__dirname, folder);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  if (folder.startsWith('app/') && !folder.startsWith('app/(auth)/onboarding') && !folder.startsWith('app/(dashboard)')) {
    // just ensuring it works for specific page creations
  }
});

// For each app path, we create a page.tsx stub if it's a route
const routes = folders.filter(f => f.startsWith('app/'));
routes.forEach(route => {
  const fullPath = path.join(__dirname, route, 'page.tsx');
  const componentName = route.replace(/[^a-zA-Z0-9]/g, '');
  const content = `export default function ${componentName}Page() {\n  return <div>${route}</div>\n}\n`;
  fs.writeFileSync(fullPath, content);
});

console.log("Scaffolding complete.");
