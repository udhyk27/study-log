import { Client } from '@notionhq/client';
import { markdownToBlocks } from '@tryfabric/martian';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import 'dotenv/config';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID;
const GH_OWNER = process.env.GITHUB_OWNER;
const GH_REPO = process.env.GITHUB_REPO;
const GH_BRANCH = process.env.GITHUB_BRANCH || 'main';

const REPO_ROOT = path.resolve('..');

// 동기화 제외 패턴 (sync-all.js와 동일)
const EXCLUDE_PATTERNS = [
  /^README\.md$/,
  /^\.github\//,
  /^scripts\//,
  /^node_modules\//,
  /^\.git\//,
  /^Templates\//,
];

function isExcluded(relPath) {
  return EXCLUDE_PATTERNS.some((re) => re.test(relPath));
}

// repo 전체에서 .md 파일 재귀 탐색
function findAllMdFiles(dir, baseDir = dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).split(path.sep).join('/');

    if (entry.isDirectory()) {
      // 제외 패턴에 걸리는 디렉토리는 들어가지 않음
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      results.push(...findAllMdFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      if (!isExcluded(relPath)) {
        results.push(relPath);
      }
    }
  }
  return results;
}

function pathToCategoryTag(relPath) {
  const parts = relPath.split('/').filter(Boolean);
  if (parts.length === 1) return { category: null, tag: null };
  const category = parts[0];
  const tag = parts.length >= 3 ? parts[1] : null;
  return { category, tag };
}

function getCreatedAt(relPath) {
  try {
    const out = execSync(
      `git log --diff-filter=A --follow --format=%aI -- "${relPath}"`,
      { cwd: REPO_ROOT, encoding: 'utf-8' }
    ).trim();
    const lines = out.split('\n').filter(Boolean);
    return lines[lines.length - 1] || null;
  } catch {
    return null;
  }
}

function getUpdatedAt(relPath) {
  try {
    const out = execSync(`git log -1 --format=%aI -- "${relPath}"`, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

function getGitHubUrl(relPath) {
  return `https://github.com/${GH_OWNER}/${GH_REPO}/blob/${GH_BRANCH}/${relPath}`;
}

function buildProperties(title, category, tag, createdAt, updatedAt, githubUrl) {
  return {
    Title: { title: [{ text: { content: title } }] },
    Category: category ? { select: { name: category } } : { select: null },
    Tag: tag ? { multi_select: [{ name: tag }] } : { multi_select: [] },
    Created: createdAt ? { date: { start: createdAt } } : { date: null },
    Updated: updatedAt ? { date: { start: updatedAt } } : { date: null },
    'GitHub URL': githubUrl ? { url: githubUrl } : { url: null },
  };
}

async function clearPageBlocks(pageId) {
  let cursor;
  do {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
    });
    for (const block of res.results) {
      await notion.blocks.delete({ block_id: block.id });
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
}

async function appendInChunks(pageId, allBlocks) {
  for (let i = 0; i < allBlocks.length; i += 100) {
    await notion.blocks.children.append({
      block_id: pageId,
      children: allBlocks.slice(i, i + 100),
    });
  }
}

// rate limit 회피용 sleep
function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function syncFile(relPath) {
  const fullPath = path.join(REPO_ROOT, relPath);
  const raw = fs.readFileSync(fullPath, 'utf-8');
  const parsed = matter(raw);
  const frontmatter = parsed.data;
  const content = parsed.content;

  const title = path.basename(relPath, '.md');
  const { category, tag } = pathToCategoryTag(relPath);
  const blocks = markdownToBlocks(content);
  const createdAt = getCreatedAt(relPath);
  const updatedAt = getUpdatedAt(relPath);
  const githubUrl = getGitHubUrl(relPath);
  const properties = buildProperties(title, category, tag, createdAt, updatedAt, githubUrl);

  let pageId = frontmatter.notion_page_id;

  if (pageId) {
    try {
      await notion.pages.update({ page_id: pageId, properties });
      await clearPageBlocks(pageId);
      await appendInChunks(pageId, blocks);
      console.log(`[수정] ${relPath}`);
      return;
    } catch (err) {
      if (err.code === 'object_not_found') {
        console.log(`[경고] page_id 무효 → 신규 생성: ${relPath}`);
        pageId = null;
      } else {
        throw err;
      }
    }
  }

  const page = await notion.pages.create({
    parent: { type: 'data_source_id', data_source_id: DATA_SOURCE_ID },
    properties,
    children: blocks.slice(0, 100),
  });
  pageId = page.id;
  if (blocks.length > 100) {
    await appendInChunks(pageId, blocks.slice(100));
  }

  const newRaw = matter.stringify(content, { ...frontmatter, notion_page_id: pageId });
  fs.writeFileSync(fullPath, newRaw, 'utf-8');
  console.log(`[신규] ${relPath}`);
}

async function main() {
  const files = findAllMdFiles(REPO_ROOT);
  console.log(`대상 .md 파일: ${files.length}개\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const relPath = files[i];
    console.log(`[${i + 1}/${files.length}] ${relPath}`);
    try {
      await syncFile(relPath);
      success++;
    } catch (err) {
      console.error(`  실패: ${err.message}`);
      failed++;
    }
    // rate limit 대응
    await sleep(100);
  }

  console.log(`\n완료: 성공 ${success}, 실패 ${failed}`);
}

main();