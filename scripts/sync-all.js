import { Client } from '@notionhq/client';
import { markdownToBlocks } from '@tryfabric/martian';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import 'dotenv/config';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID;

// GitHub Actions 환경에서는 GITHUB_REPOSITORY="owner/repo" 형태로 제공됨
function resolveGitHubInfo() {
  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    const branch =
      process.env.GITHUB_REF_NAME ||
      process.env.GITHUB_BRANCH ||
      'main';
    return { owner, repo, branch };
  }
  // 로컬 실행 시 .env 사용
  return {
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH || 'main',
  };
}

const { owner: GH_OWNER, repo: GH_REPO, branch: GH_BRANCH } = resolveGitHubInfo();

const REPO_ROOT = path.resolve('..');

// git 시간 조회 헬퍼
function getCreatedAt(relPath) {
  try {
    const out = execSync(
      `git log --diff-filter=A --follow --format=%aI -- "${relPath}"`,
      { cwd: REPO_ROOT, encoding: 'utf-8' }
    ).trim();
    // 여러 줄이면 마지막(가장 오래된)이 최초 추가
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
  // 경로 구분자 통일
  const urlPath = relPath.split(path.sep).join('/');
  return `https://github.com/${GH_OWNER}/${GH_REPO}/blob/${GH_BRANCH}/${urlPath}`;
}

// 동기화 제외 패턴
const EXCLUDE_PATTERNS = [
  /^README\.md$/,
  /^\.github\//,
  /^scripts\//,
  /^node_modules\//,
  /^Templates\//,
];

function isExcluded(relPath) {
  return EXCLUDE_PATTERNS.some((re) => re.test(relPath));
}

// 1. 변경된 .md 파일 목록 가져오기 (마지막 커밋 기준)
function getChangedMdFiles() {
  // Actions는 GITHUB_EVENT_BEFORE에 이전 커밋 SHA를 제공
  // 로컬은 HEAD~1 사용
  let diffRange;
  const before = process.env.GITHUB_EVENT_BEFORE;
  if (before && before !== '0000000000000000000000000000000000000000') {
    diffRange = `${before} HEAD`;
  } else {
    diffRange = 'HEAD~1 HEAD';
  }

  let output;
  try {
    output = execSync(`git diff --name-status ${diffRange}`, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
    });
  } catch (err) {
    console.error('git diff 실패. 비교 대상 commit이 없거나 fetch-depth 부족.');
    return [];
  }

  const lines = output.split('\n').filter(Boolean);
  const files = [];
  for (const line of lines) {
	const parts = line.split('\t');
	const rawStatus = parts[0];
	// status는 'A', 'M', 'D' 또는 'R100', 'R95' 등 → 첫 글자만 사용
	const status = rawStatus[0];

	let oldPath = null;
	let newPath;

	if (status === 'R') {
	// R: parts[1] = old, parts[2] = new
	oldPath = parts[1];
	newPath = parts[2];
	} else {
	newPath = parts[1];
	}

	if (!newPath || !newPath.endsWith('.md')) continue;
	if (isExcluded(newPath)) continue;

	files.push({ status, path: newPath, oldPath });
  }
  return files;
}

// 2. 경로 → Category, Tag 추출
function pathToCategoryTag(relPath) {
  const parts = relPath.split(path.sep).join('/').split('/');
  // parts 예시: ['Infra', 'AWS', 'ec2.md']
  if (parts.length === 1) return { category: null, tag: null };
  const category = parts[0];
  const tag = parts.length >= 3 ? parts[1] : null;
  return { category, tag };
}

// 3. Notion 헬퍼들
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

// 4. 한 파일 동기화
async function syncFile(relPath, oldPath = null) {
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

  // rename인데 frontmatter에 page_id가 없으면 이전 경로의 git 이력에서 시도
  // (예: 사용자가 frontmatter를 수동으로 지웠을 때 대비)
  if (!pageId && oldPath) {
    try {
      const before = process.env.GITHUB_EVENT_BEFORE;
      const ref = before && before !== '0000000000000000000000000000000000000000'
        ? before
        : 'HEAD~1';
      const prevRaw = execSync(`git show ${ref}:"${oldPath}"`, {
        cwd: REPO_ROOT, encoding: 'utf-8',
      });
      const prevParsed = matter(prevRaw);
      pageId = prevParsed.data.notion_page_id || null;
    } catch {
      // 무시: 신규 생성으로 fallback
    }
  }

  if (pageId) {
    try {
      await notion.pages.update({ page_id: pageId, properties });
      await clearPageBlocks(pageId);
      await appendInChunks(pageId, blocks);
      const label = oldPath ? `[이동] ${oldPath} → ${relPath}` : `[수정] ${relPath}`;
      console.log(label);

      // frontmatter에 page_id 없었던 경우 다시 기록
      if (!frontmatter.notion_page_id) {
        const newRaw = matter.stringify(content, { ...frontmatter, notion_page_id: pageId });
        fs.writeFileSync(fullPath, newRaw, 'utf-8');
      }
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

  // 신규 생성
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

// 5. 파일 삭제 처리
async function deletePage(relPath) {
  // 삭제된 파일은 워킹 트리에 없으므로 git에서 직전 버전을 가져옴
  const before = process.env.GITHUB_EVENT_BEFORE;
  const ref = before && before !== '0000000000000000000000000000000000000000'
    ? before
    : 'HEAD~1';

  let prevContent;
  try {
    prevContent = execSync(`git show ${ref}:"${relPath}"`, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
    });
  } catch {
    console.log(`[삭제 스킵] ${relPath} - 이전 버전 조회 실패`);
    return;
  }

  const parsed = matter(prevContent);
  const pageId = parsed.data.notion_page_id;

  if (!pageId) {
    console.log(`[삭제 스킵] ${relPath} - notion_page_id 없음`);
    return;
  }

  try {
    await notion.pages.update({
      page_id: pageId,
      archived: true,
    });
    console.log(`[삭제] ${relPath} → archived`);
  } catch (err) {
    if (err.code === 'object_not_found') {
      console.log(`[삭제 스킵] ${relPath} - Notion 페이지 이미 없음`);
    } else {
      throw err;
    }
  }
}

// 메인
async function main() {
  const files = getChangedMdFiles();
  console.log(`변경된 .md 파일: ${files.length}개`);

  for (const { status, path: filePath, oldPath } of files) {
    try {
      if (status === 'D') {
        await deletePage(filePath);
      } else if (status === 'R') {
        await syncFile(filePath, oldPath);
      } else {
        // A, M
        await syncFile(filePath);
      }
    } catch (err) {
      console.error(`[실패] ${filePath}:`, err.message);
    }
  }
}

main();