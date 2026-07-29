import fs from 'fs';
import path from 'path';

const dir = 'd:/HMS_Cloud_RX/frontend/src';

const replacements = [
  // Primary Text
  { regex: /'#0F172A'/g, replace: "'text.primary'" },
  { regex: /"#0F172A"/g, replace: "'text.primary'" },
  // Secondary Text
  { regex: /'#64748B'/g, replace: "'text.secondary'" },
  { regex: /"#64748B"/g, replace: "'text.secondary'" },
  // Background Default
  { regex: /'#F8FAFC'/g, replace: "'background.default'" },
  { regex: /"#F8FAFC"/g, replace: "'background.default'" },
  // Background Paper / Hover
  { regex: /'#F1F5F9'/g, replace: "'action.hover'" },
  { regex: /'#FFFFFF'/g, replace: "'background.paper'" },
  { regex: /"#FFFFFF"/g, replace: "'background.paper'" },
  // Divider / Border
  { regex: /'#E2E8F0'/g, replace: "'divider'" },
  { regex: /'#CBD5E1'/g, replace: "'action.focus'" }
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      for (const {regex, replace} of replacements) {
        content = content.replace(regex, replace);
      }
      
      content = content.replace(/border: '1px solid (?:#E2E8F0|divider)'/g, "border: 1, borderColor: 'divider'");
      content = content.replace(/borderBottom: '1px solid (?:#E2E8F0|divider)'/g, "borderBottom: 1, borderColor: 'divider'");
      content = content.replace(/borderTop: '1px solid (?:#E2E8F0|divider)'/g, "borderTop: 1, borderColor: 'divider'");
      content = content.replace(/borderLeft: '1px solid (?:#E2E8F0|divider)'/g, "borderLeft: 1, borderColor: 'divider'");
      content = content.replace(/borderRight: '1px solid (?:#E2E8F0|divider)'/g, "borderRight: 1, borderColor: 'divider'");
      
      // Specifically for Sidebar active link which uses '#4F46E5' hardcoded text
      // Let's not touch brand colors right now, just the structural ones.

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(dir);
