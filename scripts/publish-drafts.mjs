// 发布草稿：把 drafts.* 的内容写入正式文档，并删除草稿
// 用法：node scripts/publish-drafts.mjs
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const PROJECT = 'rja1apyh'
const DATASET = 'production'
const API = `https://${PROJECT}.api.sanity.io/v2024-01-01`

const token = JSON.parse(readFileSync(join(homedir(), '.config/sanity/config.json'), 'utf8')).authToken
if (!token) throw new Error('缺少 Sanity authToken')

const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
const req = (url, opts = {}) => fetch(url, { ...opts, headers: { ...headers, ...(opts.headers || {}) } })

const q = `*[_id in path("drafts.**")]`
const base = await req(`${API}/data/query/${DATASET}?query=${encodeURIComponent(q)}`)
if (!base.ok) throw new Error(`查询草稿失败 ${base.status}: ${await base.text()}`)
const drafts = (await base.json()).result
if (!drafts.length) {
  console.log('没有待发布草稿')
  process.exit(0)
}

const mutations = []
for (const d of drafts) {
  const doc = { ...d }
  delete doc._rev
  delete doc._updatedAt
  doc._id = d._id.replace(/^drafts\./, '')
  mutations.push({ createOrReplace: doc })
  mutations.push({ delete: { id: d._id } })
}

const res = await req(`${API}/data/mutate/${DATASET}?returnIds=true`, {
  method: 'POST',
  body: JSON.stringify({ mutations }),
})
if (!res.ok) throw new Error(`发布失败 ${res.status}: ${await res.text()}`)
const out = await res.json()
console.log(`已发布 ${drafts.length} 个草稿：`)
drafts.forEach((d) => console.log('  ·', d._id, d.slug?.current || '', d.title || ''))
console.log('结果：', JSON.stringify(out.results?.map((r) => r.id)).slice(0, 400))
