import { build } from './lib/project.js';
try {
  const {project,report,sources} = build();
  console.log(JSON.stringify({command:'build',artifact:`dist/${project.artifact}`,version:project.version,modules:sources.length-2,...report},null,2));
} catch(error) { console.error(error.message); process.exitCode=1; }
