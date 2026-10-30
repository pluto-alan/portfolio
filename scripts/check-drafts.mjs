// 查看草稿相对已发布文档改了哪些字段（只读，不修改）
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config/sanity/config.json'), 'utf8'))
const token = cfg.authToken
const pid = 'rja1apyh'
const dataset = 'production'

const query = `{
  "pub": *[_type == "work" && !(_id in path("drafts.**"))]{_id, title, category, year, summary, description, cover, modules, slug},
  "draft": *[_type == "work" && _id in path("drafts.**")]{_id, title, category, year, summary, description, cover, modules, slug}
}`

const res = await fetch(
  `https://${pid}.api.sanity.io/v2025-01-01/data/query/${dataset}?query=${encodeURIComponent(query)}`,
  { headers: { Authorization: `Bearer ${token}` } },
)
const json = await res.json()
if (!json.result) {
  console.error('query failed:', JSON.stringify(json))
  process.exit(1)
}

const pub = json.result.pub || []
const draft = json.result.draft || []
const norm = (v) => JSON.stringify(v ?? null)

for (const dr of draft) {
  const id = dr._id.replace(/^drafts\./, '')
  const pu = pub.find((p) => p._id === id)
  const changed = ['title', 'category', 'year', 'summary', 'description', 'cover', 'modules', 'slug'].filter(
    (k) => norm(dr[k]) !== norm(pu?.[k]),
  )
  console.log(`${id} | 标题: ${pu?.title} → ${dr.title} | 改动字段: ${changed.join(', ') || '无'}`)
}
