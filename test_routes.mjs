const urls = [
  'http://localhost:3000',
  'http://localhost:3000/simulator/new',
  'http://localhost:3000/simulator/live',
  'http://localhost:3000/results',
  'http://localhost:3000/compare',
  'http://localhost:3000/learn',
  'http://localhost:3000/learn/process-threads',
  'http://localhost:3000/learn/process-states',
  'http://localhost:3000/learn/cpu-scheduling',
  'http://localhost:3000/learn/algorithms',
  'http://localhost:3000/about',
];

async function checkAll() {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(`${res.status} OK: ${url}`);
    } catch (err) {
      console.error(`FAILED: ${url}`, err.message);
    }
  }
}

checkAll();
