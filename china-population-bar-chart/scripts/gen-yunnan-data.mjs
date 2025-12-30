import fs from 'node:fs';
import path from 'node:path';

const url = 'https://geo.datav.aliyun.com/areas_v3/bound/geojson?code=530000_full_district';
const projectRoot = path.resolve(process.cwd());
const dataFile = path.join(projectRoot, 'src', 'data.js');

async function main() {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }
  const geojson = await res.json();
  const names = geojson.features
    .map(f => f?.properties?.name ?? String(f?.properties?.adcode ?? ''))
    .filter(Boolean);

  // 去重并排序，生成模板映射
  const uniq = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  const entries = uniq.map(n => `  "${n}": 0`).join(',\n');
  const content = `export const districtValues = {\n${entries}\n};\n`;

  fs.writeFileSync(dataFile, content, 'utf-8');
  console.log(`Wrote ${uniq.length} Yunnan district entries to ${dataFile}`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
