// 把「集锦长图」素材作品标记为不参与首页列表
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const PROJECT = 'rja1apyh'
const DATASET = 'production'
const API = `https://${PROJECT}.api.sanity.io/v2024-01-01`
const token = JSON.parse(readFileSync(join(homedir(), '.config/sanity/config.json'), 'utf8')).authToken
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

const SLUGS = ['work-20', 'work-24', 'work-28']
const q = encodeURIComponent(`*[_type=="work" && slug.current in ${JSON.stringify(SLUGS)}]{_id, "slug": slug.current}`)
const list = await (await fetch(`${API}/data/query/${DATASET}?query=${q}`, { headers })).json()
console.log('命中：', list.result.map((d) => `${d._id}(${d.slug})`).join(', '))

const mutations = list.result.map((d) => ({
  patch: { id: d._id.replace(/^drafts\./, ''), set: { hideFromGrid: true } },
}))
const res = await fetch(`${API}/data/mutate/${DATASET}`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ mutations }),
})
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
console.log('已标记', mutations.length, '个素材作品')
