import { Client } from '@notionhq/client';
import { markdownToBlocks } from '@tryfabric/martian';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID;

const FILE_PATH = '../README.md';
const fullPath = path.resolve(FILE_PATH);

// 1. 파일 읽기 + frontmatter 파싱
const raw = fs.readFileSync(fullPath, 'utf-8');
const parsed = matter(raw);
const frontmatter = parsed.data;
const content = parsed.content;

const title = path.basename(FILE_PATH, '.md');
const blocks = markdownToBlocks(content);

// 2. 페이지 children을 한 번에 100개씩 채우는 헬퍼
async function appendInChunks(pageId, allBlocks) {
  for (let i = 0; i < allBlocks.length; i += 100) {
    await notion.blocks.children.append({
      block_id: pageId,
      children: allBlocks.slice(i, i + 100),
    });
  }
}

// 3. 기존 블록 전부 archive하는 헬퍼
async function clearPageBlocks(pageId) {
  let cursor = undefined;
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

let pageId = frontmatter.notion_page_id;

if (!pageId) {
  // 신규 생성
  console.log('신규 페이지 생성');
  const page = await notion.pages.create({
    parent: { type: 'data_source_id', data_source_id: DATA_SOURCE_ID },
    properties: {
      Title: { title: [{ text: { content: title } }] },
    },
    children: blocks.slice(0, 100),
  });
  pageId = page.id;
  if (blocks.length > 100) {
    await appendInChunks(pageId, blocks.slice(100));
  }
  console.log('생성 완료:', page.url);

  // frontmatter에 page_id 기록 후 파일 다시 쓰기
  const newFrontmatter = { ...frontmatter, notion_page_id: pageId };
  const newRaw = matter.stringify(content, newFrontmatter);
  fs.writeFileSync(fullPath, newRaw, 'utf-8');
  console.log('frontmatter 갱신 완료');
} else {
  // 업데이트: 기존 블록 비우고 새로 채우기
  console.log('기존 페이지 업데이트:', pageId);
  await clearPageBlocks(pageId);
  await appendInChunks(pageId, blocks);
  console.log('업데이트 완료');
}