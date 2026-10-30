import { Studio } from 'sanity'
import config from '../../sanity.config.js'

export default function StudioRoute() {
  return <Studio config={config} />
}
