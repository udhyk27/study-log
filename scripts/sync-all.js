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
    const [status, ...rest] = line.split('\t');
    const filePath = rest.join('\t');
    if (!filePath.endsWith('.md')) continue;
    if (isExcluded(filePath)) continue;
    files.push({ status, path: filePath });
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
  const props = {
    Title: { title: [{ text: { content: title } }] },
  };
  if (category) {
    props.Category = { select: { name: category } };
  }
  if (tag) {
    props.Tag = { multi_select: [{ name: tag }] };
  }
  if (createdAt) {
    props.Created = { date: { start: createdAt } };
  }
  if (updatedAt) {
    props.Updated = { date: { start: updatedAt } };
  }
  if (githubUrl) {
    props['GitHub URL'] = { url: githubUrl };
  }
  return props;
}

// 4. 한 파일 동기화
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
    // 업데이트 시도
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

  // frontmatter 갱신
  const newRaw = matter.stringify(content, { ...frontmatter, notion_page_id: pageId });
  fs.writeFileSync(fullPath, newRaw, 'utf-8');
  console.log(`[신규] ${relPath}`);
}

// 5. 파일 삭제 처리
async function deletePage(relPath) {
  // 삭제는 git에서 이미 사라진 상태라 frontmatter를 읽을 수 없음
  // → 이번 단계에서는 일단 로그만 남기고 건너뜀 (다음 단계에서 처리)
  console.log(`[삭제 보류] ${relPath} (별도 처리 필요)`);
}

// 메인
async function main() {
  const files = getChangedMdFiles();
  console.log(`변경된 .md 파일: ${files.length}개`);

  for (const { status, path: filePath } of files) {
    try {
      if (status === 'D') {
        await deletePage(filePath);
      } else {
        // A(추가), M(수정), R(이름변경)은 모두 syncFile로
        // R의 경우 git diff에서 "R100\told\tnew" 형식이라 별도 처리 필요할 수 있음
        await syncFile(filePath);
      }
    } catch (err) {
      console.error(`[실패] ${filePath}:`, err.message);
    }
  }
}

main();