import { Client } from '@notionhq/client';
import 'dotenv/config';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const dataSource = await notion.dataSources.retrieve({
  data_source_id: process.env.NOTION_DATA_SOURCE_ID,
});

console.log('연결 성공');
console.log('Data Source 이름:', dataSource.name);
console.log('속성:', Object.keys(dataSource.properties));